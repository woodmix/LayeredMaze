/**
 * クリアシーンで使うUIを収める。
 */

//==========================================================================================================
/**
 * タイトルロゴを表示する実行素子。
 */
class ClearFascia extends Executant {

    _constructor() {
        super._constructor();

        this.layer = ClearScene.UI;
        this.setBehavior( new ImageRenderer("clear") );
        this.setBehavior( new NaturalBody() );

        // 画面中央に位置するようにする。
        var anchor = new PositionAnchor();
        anchor.offset = new Point(0, -30);
        this.setBehavior(anchor);
    }
}


//==========================================================================================================
/**
 * スコアを表示する実行素子。
 */
class ClearScore extends Executant {

    _constructor(score) {
        super._constructor();

        this.layer = ClearScene.UI;
        this.text = "score: " + score;

        // レンダラの設定。
        var renderer = new TextRenderer();
        renderer.size = 42;
        renderer.style = "darkblue";
        renderer.halign = "center";
        this.setBehavior(renderer);

        // 画面中央に位置するようにする。
        var anchor = new PositionAnchor();
        anchor.offset = new Point(0, +30);
        this.setBehavior(anchor);
    }
}
