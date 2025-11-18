
/**
 * ゲームクリア画面のシーンクラス。
 */
class ClearScene extends FollowScene {

    //-----------------------------------------------------------------------------------------------------
    /**
     * @param   描画対象となる <canvas> 要素かそのid値。
     * @param   表示するスコア。
     */
    _constructor(canvas, score) {
        super._constructor(canvas);

        this.layer = 0;
        this.setBehavior( new FillRenderer("darkseagreen") );
        this.setBehavior( new InteractBehavior() );

        // タイトルロゴ。
        this.setChild(new ClearFascia(), "fascia");

        // スコア表示。
        this.setChild(new ClearScore(score), "score");

        // 一定時間ごとに花火セットメソッドが呼ばれるようにする。一輪花火。
        var clocker = new Clocker( Approx.fuzz(1000, 300) );
        this.setBehavior(new ClockBehavior(clocker, "clocked1"), "clock1");

        // 二輪花火。
        var clocker = new Clocker(1500);
        this.setBehavior(new ClockBehavior(clocker, "clocked2"), "clock2");

        // デバッグ素子。
        if(Settings["debug"]) {
            this.setChild(new DebugInfo(), "debug-info");
            this.setChild(new DebugGrid(), "debug-grid");
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。素子階層に追加されるたびに、最初のアップデートフェーズで呼ばれる。
     */
    activate(scene) {

        // 最初のSE。
        Acousmato.strikeEffect("game-versus2");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 一定時間ごとに呼ばれる。一輪花火をセットする。
     */
    clocked1() {

        // セットする位置を決定。
        var camera = this.behaviors["body"].getRect();
        var position = camera.rateSwell(0.8).random().int();

        this.makeFirework(position, 500);
    }

    /**
     * 一定時間ごとに呼ばれる。二輪花火をセットする。
     */
    clocked2() {

        // セットする位置を決定。
        var camera = this.behaviors["body"].getRect();
        var position = camera.rateSwell(0.8).random().int();

        // 同心円の異なる半径で二つの花火をセットする。
        this.makeFirework(position, 400);
        this.makeFirework(position, 600);
    }

    /**
     * 引数に指定された位置と半径で花火をセットする。
     */
    makeFirework(pos, distance) {

        // 色を決定。
        var color = ["orangered", "royalblue", "lightcyan", "darkorchid", "gold"].random();

        var mist = new FireworkMist(color, distance);
        mist.position.put(pos);
        this.setChild(mist, null, "firework-");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * タップされたら呼ばれる。
     */
    tap(point) {

        // タップ時SE。
        Acousmato.strikeEffect("roll-finish1");

        // インタラクターを外して、もうタップに反応しないようにする。
        this.setBehavior(null, "interactor");

        // ブラックアウトを始動。
        var veil = new AlphaVeilant("in", "black", 1500);
        veil.layer = ClearScene.VEIL;
        veil.setBehavior( new CanvasBody() );
        veil.onfinish = "finishVeil";
        this.setChild(veil);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 終了時のブラックアウトが完了したら呼ばれる。
     */
    finishVeil() {

        // タイトルシーンへ切り替え。
        this.accede( canvas => new TitleScene(canvas) );
    }
}

// レイヤー順の定義。
ClearScene.EFFECT = 1;
ClearScene.UI = 2;
ClearScene.VEIL = 3;
