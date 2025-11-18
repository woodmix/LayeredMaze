
/**
 * フロア全体を表す実行素子。
 */
class StageExecutant extends PrimFloat {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   フロア番号
     * @param   立入経路。移動後の開始位置参照などに使用される。
     */
    _constructor(floor, enterport = "gamestart") {
        super._constructor();

        this.floor = floor;
        this.enterport = enterport;
        this.layer = MainScene.STAGE;

        // フロートとしての挙動にマージンを設定する。
        this.floatMargin = 100;

        // キャンバスサイズが変わったとき、自然な位置になるようにする。
        this.setBehavior( new CenterSizer() );

        // ドラッグ可能、また、タップされたときに tap() が呼ばれるようにする。
        this.setBehavior( new DraggableInteractor() );

        // ボディビヘイバーを作成。
        var body = new class extends BodyBehavior {
            getRect() {
                return new Rect(0, 0, this.host.map.largeness.clone().multi(StageBox.TIPSIZE));
            }
        };
        this.setBehavior(body);

        // 補助ビヘイバー・補助素子を作成。
        var trailer = "%+d".format(floor);

        this.map = new StageMap(trailer);
        this.setBehavior(this.map, "renderer");

        this.supervisor = new StageSupervisor(trailer);
        this.setBehavior(this.supervisor, "supervisor");

        this.markers = new StageMarker();
        this.setChild(this.markers, "markers");

        // デバッグ
        if(Settings["debug"]) {
            this.setChild(new DebugGrid(StageBox.TIPSIZE), "debug-grid");
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。素子階層に追加されるたびに、最初のアップデートフェーズで呼ばれる。
     */
    activate(scene) {
        super.activate(scene);

        // ユニット素子と可視ギミック素子を作成・初期化する。
        this.createUnits();
        this.createOrnaments();

        // カメラのサイズを取得。
        var camera = this.takeBody(scene);

        // プレイヤーキャラがカメラの中央に位置するようにステージの位置を調整する。
        camera.center = this.player.position;
        this.position.put( camera.lt.multi(-1) );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ユニットを表す実行素子を作成し、関連プロパティを初期化する。
     */
    createUnits() {

        // 該当のフロアデータを取得。
        var floordata = this.supervisor.floordata;

        // プレイヤー素子を作成。
        this.player = new PlayerUnit(this, floordata.start[this.enterport]);
        this.setChild(this.player, "unit-0");

        // 敵素子を作成。
        for(var index = 0, enemy ; enemy = floordata.enemies[index] ; index++) {

            if( this.supervisor.memory.terminated.includes(index) )  continue;

            var foe = new EnemyUnit(this, enemy);
            foe.enemyindex = index;
            this.setChild(foe, `unit-${index+1}`);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 可視ギミックを表す実行素子を作成する。
     */
    createOrnaments() {

        // ギミックのうち、可視のものを実行素子として作成していく。素子の名前は "ornament-" にギミック名を続けたものとする。
        for(var [name, gimmick] of this.supervisor.gimmicks) {

            if(gimmick.ornament) {
                var constructor = OrnamentExecutant.getOrnamentClass(gimmick.ornament);
                var ornament = new constructor(gimmick.ornament, this, gimmick.trigger.into);
                this.setChild(ornament, `ornament-${name}`);
            }
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 現在ステージ上に存在するユニット素子の配列を表す。
     */
    get units() {

        var units = [];

        for(var [name, ant] of this.childs)
            if(name.startsWith("unit-"))  units.push(ant);

        return units;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ステージがタップされたら呼ばれる。
     */
    tap(pos) {

        var tapped = pos.clone().divide(StageBox.TIPSIZE).int();
        var box = this.map.getBox(tapped);

        this.player.boxTapped(box);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定されたボックス位置で、指定されたスコアの獲得処理を行う。
     *
     * @param   スコア
     * @param   表示位置
     */
    acquireScore(score, seat) {

        // スコア加算。
        this.parent.scorer.slide(score);

        // ステージ上に獲得スコアを表示。
        var displayer = new ScoreDisplayer(score);
        displayer.position.put(this.map.getBox(seat).center);
        this.setChild(displayer);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 画面を振動させる。
     */
    vibrate() {

        // 振動を行う移動器を作成。800ms、振幅20、周波数10、減衰有り。
        var mover = new VibrateMover("xsquare", 800, 20, 10, true);
        this.setBehavior(mover);

        // ただ、この素子は親素子の領域(画面)に縛られているので、振動中は解放する必要がある。
        this.leashed = false;
        mover.onfinish = () => this.leashed = true;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フロアを切り替える。
     *
     * @param   上昇なら "up"、降下なら "down"。
     * @param   立入経路。移動後の開始位置参照などに使用される。
     */
    changeFloor(updown, port) {

        // インタラクターを外してユーザ操作に反応しないようにする。
        this.setBehavior(null, "interactor");

        // 一定距離を上へ移動。ステージの画面内束縛を外しておく。
        var move = (updown == "up") ? 300 : -300;
        var walker = new LineWalker({dest:new Point(0, move)});
        this.setBehavior( new WalkMover(walker, 1000) );
        this.leashed = false;

        // 同時にブラックアウトしていくようにする。
        var veil = new AlphaVeilant("in", "black", 1000);
        veil.layer = MainScene.VEIL;
        veil.setBehavior( new CanvasBody() );
        this.setChild(veil);

        // 終わったら...
        veil.onfinish = () => {

            // 切り替え後のフロア番号を取得。
            var floor = this.floor + (updown == "up" ? +1 : -1);

            // 新しいステージを作成して、自身と交代する。
            var next = new StageExecutant(floor, port);
            this.parent.setChild( next, this.getId() );
        }
    }
}
