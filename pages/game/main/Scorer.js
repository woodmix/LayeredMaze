
/**
 * 画面右上の累計スコアを表すNumberExecutant。
 */
class Scorer extends NumberExecutant {

    //------------------------------------------------------------------------------------------------------
    _constructor() {

        // ボディ右上をピボットとする。
        super._constructor( "numbers", new Point(1, 0) );

        // 現在スコアと、変化開始時の表示値。
        this.score = 0;
        this.start = 0;

        // 見た目の設定。
        this.layer = MainScene.UI;
        this.setBehavior( new PositionAnchor(null, new Point(1, 0), new Point(-30, 30)) );
        this.space = -10;

        // 表示値スライド中の処理をキックするビヘイバーを作成。セットするのは後。
        this.tictocer = new class extends mixin(Behavior, ProgressionTrait) {
            tictoc(progress, scene) { this.host.tictoc(progress, scene) }
        };
        this.tictocer.autoremove = true;

        // 表示値スライドに使う補間器。
        this.polator = new EaseinPolator();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された分だけスコアを増減する。
     *
     * @param   増減値。
     */
    slide(width) {

        // マイナスにはならないようにする。
        if(this.score + width < 0)  width = -this.score;

        // 変化なしなら何もしない。
        if(width == 0)  return;

        // 変化開始値と変化後のスコアを取得。
        this.start = this.value;
        this.score += width;

        // どれくらいの時間をかけて表示値を新スコアに追随させるかを決定。
        // 基本的に1pt変化するのに20msかけるが、2000msより長くはかからないようにする。
        this.tictocer.duration = Math.min( 2000, Math.floor(Math.abs(width) * 20) );

        // その時間の間、表示値スライド処理がキックされるようにする。
        this.setBehavior(this.tictocer, "tictoc");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 表示値スライド処理が有効な間、毎フレーム呼び出される。
     */
    tictoc(progress, scene) {

        // スライド処理の時間経過率と補間器を使って、変化開始時の表示値から現在スコアへと近づけていく。
        this.value = this.start + Math.floor( this.polator.polate(progress) * (this.score - this.start) );
    }
}
