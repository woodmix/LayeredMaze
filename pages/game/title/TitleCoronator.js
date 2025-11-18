
/**
 * ゲームタイトル画面からメイン画面への切り替えを行う実行素子。
 */
class TitleCoronator extends CoronatingHostant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   タップされた座標。
     */
    _constructor(center) {

        // 次のシーンを作成して基底のコンストラクタ処理を行う。
        super._constructor( new MainScene(null, 1) );

        // タップされた座標を原点とする。
        this.position.put(center);

        // 次のシーンの描画内容をベールとして、タップした位置から円状に広がり現れていくものとする。
        var renderer = new ImageRenderer(this.secondary.canvas);
        var veil = new CircleVeilant("circle-in", renderer, 4500);
        veil.layer = 2;
        veil.setBehavior( new CanvasBody() );
        this.setChild(veil);

        // 広がりきったら終了。
        veil.onfinish = "finished";
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 終了時の処理を行う。
     */
    finished() {

        // BGM開始
        Acousmato.playMusic("WhIte");

        // 広がりきったらキャンバス制御を引き継ぐ。
        this.takeoverCrown();
    }
}
