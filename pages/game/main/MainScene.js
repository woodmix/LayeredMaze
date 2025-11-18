
/**
 * ゲームメイン部のシーンクラス。
 */
class MainScene extends FollowScene {

    //-----------------------------------------------------------------------------------------------------
    /**
     * @param   描画対象となる <canvas> 要素かそのid値。
     */
    _constructor(canvas) {
        super._constructor(canvas);

        this.layer = 0;
        this.setBehavior( new FillRenderer("black") );

        // フロアを移動しても覚えているべき情報のコレクションを初期化。次のように運用している。
        //      フロアID
        //          extinguished    起動済みの oneshot フラグ付きギミックの名前。
        //          terminated      撃破済みの敵インデックス。
        this.stagememory = {};

        // ステージ素子を作成。
        this.setChild(new StageExecutant(0), "stage");
//         this.setChild(new StageExecutant(-2, "stairs-b"), "stage");

        // スコア表示素子を作成。
        this.scorer = new Scorer();
        this.setChild(this.scorer, "scorer");

        // デバッグ素子。
        if(Settings["debug"]) {
            this.setChild(new DebugInfo(), "debug-info");
        }
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * ゲームクリア処理を行う。
     */
    processGoal() {

        // ステージオブジェクトのインタラクターを外してユーザ操作に反応しないようにする。
        this.childs["stage"].setBehavior(null, "interactor");

        // アルファによるブラックアウトを始動。
        var veil = new AlphaVeilant("in", "black", 1500);
        veil.layer = MainScene.VEIL;
        veil.setBehavior( new CanvasBody() );
        veil.onfinish = "finishGoal";
        this.setChild(veil);

        // BGMフェードアウト。
        Acousmato.fadeMusic("out", 1500);
    }

    /**
     * クリア時のブラックアウトが完了したら呼ばれる。
     */
    finishGoal() {

        // クリアシーンへ切り替え。
        this.accede( canvas => new ClearScene(canvas, this.scorer.score) );
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * ゲームオーバー処理を行う。
     *
     * @param   プレイヤーユニットを表す実行素子。
     */
    processOver(player) {

        // ステージオブジェクトのインタラクターを外してユーザ操作に反応しないようにする。
        this.childs["stage"].setBehavior(null, "interactor");

        // サークルによるブラックアウトを始動。
        var veil = new CircleVeilant("cover-in", "black", 1500);
        veil.layer = MainScene.VEIL;
        veil.setBehavior( new CanvasBody() );
        veil.onfinish = "finishOver";
        this.setChild(veil);

        // サークルの中心をプレイヤーキャラの座標とする。
        veil.position.put( this.takeCoord(Point.ZERO, player) );
    }

    /**
     * ゲームオーバー時のブラックアウトが完了したら呼ばれる。
     */
    finishOver() {

        // タイトルシーンへ切り替え。
        this.accede( canvas => new TitleScene(canvas) );
    }
}

// レイヤー定義。
MainScene.STAGE = 1;
MainScene.GMMICK = 2;
MainScene.MARKER = 3;
MainScene.ENEMY = 4;
MainScene.ENEMYICON = 5;
MainScene.PLAYER = 6;
MainScene.EFFECT = 7;
MainScene.UI = 8;
MainScene.VEIL = 9;

// スコアの定義。
MainScene.FRUIT = 100;
MainScene.TERMINATE = 50;
MainScene.WALK = 2;
