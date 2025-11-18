
/**
 * スケールを拡大・縮小することでリアクションを表現する実行素子。
 */
class BoingExecutant extends ScalableExecutant {

    //------------------------------------------------------------------------------------------------------
    _constructor() {
        super._constructor();

        // リアクションとして作用するツイーンビヘイバを作成。
        // リアクションは素子のスケールを拡大・縮小することで行う。拡大率は、正弦波を上下反転して一周半した曲線をリニアに減衰させて生成する。
        //            ┌─┐
        //      0---  │  │  ┌─
        //            │  └─┘
        //          ─┘
        //  …て感じ。
        //  とりあえずX軸に対するものを作成。

        // 正弦波を横に縮小して、0.0-1.0 で一周半する補間器を作成。
        var polator = new RunPolator(new SinPolator(), 0.666);

        // その補間器に減衰をかける。
        var polator = new DecayPolator(polator);

        // あとはその1.0のときの出力を -0.3 とし、再生時間を設定してツイーンを作成する。
        this.reactionX = new TweenBehavior("scale.x", -0.3, 300, polator);
        this.reactionX.autoremove = true;
        this.reactionX.absolute = true;

        // それをクローンしてY軸版を作成。
        this.reactionY = this.reactionX.clone();
        this.reactionY.target = "scale.y";
    }

    //------------------------------------------------------------------------------------------------------
   /**
     * オーバーライド。素子階層に追加されるたびに、最初のアップデートフェーズで呼ばれる。
     */
    activate(scene) {

        this.initialScale = this.scale.clone();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * リアクションを再生する。X, Y軸ともに同じスケールを適用するので、最初は縮小して、その後反動するようなアクション。押下に対する反応などの用途。
     */
    boing() {

        this.scale.put(this.initialScale);
        this.setBehavior(this.reactionX.clone(), "reactorX");
        this.setBehavior(this.reactionY.clone(), "reactorY");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * すこし変えたバージョン。X, Y軸に反対方向のスケールを適用する。なんかプルプルしてる感じ。
     */
    boing2() {

        this.boing();

        var reactionX = this.searchBud("behavior", "reactorX");
        reactionX.distance *= -1;
    }
}
