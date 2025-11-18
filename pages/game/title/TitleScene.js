
/**
 * ゲームタイトル画面のシーンクラス。
 */
class TitleScene extends FollowScene {

    //-----------------------------------------------------------------------------------------------------
    /**
     * @param   描画対象となる <canvas> 要素かそのid値。
     */
    _constructor(canvas) {
        super._constructor(canvas);

        this.layer = 0;
        this.setBehavior( new FillRenderer("darkseagreen") );
        this.setBehavior( new InteractBehavior() );

        // タイトルロゴ。
        this.setChild( new TitleFascia() );

        // デバッグ素子。
        if(Settings["debug"]) {
            this.setChild(new DebugInfo(), "debug-info");
            this.setChild(new DebugGrid(), "debug-grid");
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * タップされたら呼ばれる。
     */
    tap(point) {

        // タップ時SE。
        Acousmato.strikeEffect("tympani-roll1");

        // BGMを再生してすぐポーズする。モバイル端末ではジェスチャーハンドラの中でないと再生開始できないため。
        Acousmato.readyMusic("WhIte");

        // インタラクターを外して、もうタップに反応しないようにする。
        this.setBehavior(null, "interactor");

        // シーン切り替え器を作成。
        this.setChild( new TitleCoronator(point) );
    }
}


//==========================================================================================================
/**
 * タイトルロゴを表示する実行素子。
 */
class TitleFascia extends Executant {

    _constructor() {
        super._constructor();

        this.layer = 1;
        this.setBehavior( new ImageRenderer("title") );
        this.setBehavior( new NaturalBody() );

        // 画面中央に位置するようにする。
        this.setBehavior( new PositionAnchor() );
    }
}
