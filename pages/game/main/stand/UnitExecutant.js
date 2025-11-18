
/**
 * ステージ上のユニットを表す実行素子の基底。
 */
class UnitExecutant extends StandExecutant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   ユニット画像の名前。
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(graph, stage, seat) {
        super._constructor(stage, seat);

        // ユニットの所属を表す識別子。
        this.unioncode = undefined;

        // アニメーションの作成。上、左、右、下の順で格納する。
        var atlas = Asset.take(graph);
        this.animators = [
            this.createAnimator( atlas.piece(0, 0) ),   this.createAnimator( atlas.piece(0, 1) ),
            this.createAnimator( atlas.piece(0, 2) ),   this.createAnimator( atlas.piece(0, 3) ),
        ]
        this.setBehavior(this.animators[0]);

        // ボックスを移動するときの移動器を作成しておく。セットするのはボックスを移動するとき。
        var walker = new LineWalker({polator:"easein", dest:new Point()});
        this.mover = new WalkMover(walker, 200);
        this.mover.autoremove = true;

        // 同様に、壁に向かって移動しようとしたときの移動器(アレスタ)を作成しておく。
        // 少し移動しようとするけど途中で戻ってくるような動きになる。
        this.arrester = new PikoMover(0, 200);

        // もう一つ、何もしない場合の移動器(ノーアクション)を作成しておく。
        // その場でちょっとジャンプするような動き。
        this.noaction = new PikoMover([0, -48], 200);
    }

    /**
     * 指定されたイメージを使った移動アニメーションを作成する。
     *
     * @param   使用するイメージ。
     * @return  作成した移動アニメーションレンダラ。
     */
    createAnimator(image) {

        var animator = new CustomAnimator([
            {image:image, duration:  1, offset:new Point(0,   0)},
            {image:image, duration: 50, offset:new Point(0, -10)},
            {image:image, duration: 50, offset:new Point(0,   0)},
            {image:image, duration:200, offset:new Point(0, -10)},
            {image:image, duration:200, offset:new Point(0,   0)},
        ]);
        animator.animate(false);
        animator.onround = "onAnimationRounded";

        return animator;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 次のアクションを決定して実行する。
     *
     * @param   このメソッドを呼び足す理由になったStageCommand。
     */
    performAction(command) {

        throw "実装してください";
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * アクション実行中かどうかを返す。
     */
    inAction() {

        // とりあえず移動中かどうかで判断している。
        return !!this.behaviors["mover"];
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 他ユニットと同じボックスに位置することになったら呼ばれる。
     */
    jostled(bumper) {

        // 基底としてはやることはない。
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 引数で指定されたボックスに位置する。
     *
     * @param   移動先ボックスを表すStageBox。
     */
    moveTo(to) {

        // ボックス単位での移動量を取得。
        var diff = to.point.clone().sub(this.seatbox.point);

        // 所在ボックスを変更。
        this.seatbox = to;

        // 移動器に実際の移動量をセットして自身にアタッチする。
        this.mover.walker.dest.put( diff.multi(StageBox.TIPSIZE) );
        this.setBehavior(this.mover, "mover");

        // 移動方向に応じたアニメーションに変更。
        var renderer = this.animators[ Math.floor(diff.padnum() / 2) ];
        renderer.animate(true);
        this.setBehaviorNow(renderer);

        // スーパーバイザーにボックスの移動を通知。
        this.stage.supervisor.notifyMove(this);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * アニメーションが一周したら呼ばれる。
     */
    onAnimationRounded(animator) {

        // 移動中ならそのままアニメループする
        if( this.behaviors["mover"] )  return;

        // 移動中が終わっているなら、一周した時点でアニメーションストップする。
        animator.reset();
        animator.animate(false);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 撃破時の処理を行う。
     */
    falldown() {

        // どれくらいの時間でアニメーションするか(ms)。
        const DURATION = 1000;

        // レンダラに回転機能を持たせる。
        var renderer = new RotateRenderer(this.behaviors["renderer"], new Point(0.5));
        this.setBehavior(renderer, "renderer");

        // ツイーンで回転するようにする。
        var tween = new TweenBehavior("behaviors.renderer.angle", Math.PI360+Math.PI180, DURATION);
        tween.autoremove = true;
        this.setBehavior(tween);

        // 二回跳ねる動きを行う移動器を作成。
        var walker = new CoalesceWalker({
            rail: {
                 50: {type:"line", dest:new Point(0, -200), polator:"jump"},
                100: {type:"line", dest:new Point(0, -100), polator:"jump"},
            },
        });
        var mover = new WalkMover(walker, DURATION);
        mover.autoremove = true;
        this.setBehavior(mover);

        // 移動器の動作が終わったらこの素子を削除する。
        mover.onfinish = "dropoff";

        // ミストをセット。
        this.setChild(new FalldownMist(), "fallmist");
    }
}
