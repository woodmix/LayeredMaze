
/**
 * 引数で指定された補間器を使って、宿主の特定の値に対してトゥイーンを行うビヘイバ。
 * フレームごとに補間器が返す値の変化量を適用するので、外部要因でその値を動かしてもちゃんと引き継がれる。
 */
class TweenBehavior extends mixin(Behavior, ProgressionTrait) {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   変化させたいプロパティの記述。たとえば position.x を変化させたいなら "position.x" と指定する。
     * @param   移動方向・距離。マイナス方向に移動するならマイナスで指定する。
     * @param   何ミリ秒としてトゥイーンするか。
     * @param   参照する補間器。省略時は LinearPolator を使う。
     */
    constructor(target, distance, duration, polator) {
        super();
        this.initializeTimer(duration);

        this.target = target;
        this.distance = distance;
        this.polator = Interpolator.normalize(polator);

        // プロパティの絶対値に対して適用したいならtrueを指定する。この場合、変化量は単純なプラスマイナスではなく、絶対値を増やすか減らすかとして
        // 解釈される。例えば、プロパティの値が-5のときに変化量3なら、変化後は-8に、変化量-2なら変化後は-3になる。
        this.absolute = false;

        // 継承によって以下のプロパティも定義されている。
        // this.onfinish        目標に到達したら呼び出される宿主のメソッド名かコールバック関数。
        // this.autoremove      到達時に自身を削除するなら true を指定する。

        // このクラスは reset が必要。
        this.needReset();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。needReset() を呼んだ後、最初にbehave()が呼ばれる代わりに呼ばれる。
     */
    reset(scene) {

        // 前回の値を初期化。
        this.previous = 0.0;

        // 基底の処理。
        this.super(TweenBehavior.prototype.reset, scene);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 毎フレーム実行される。
     */
    tictoc(progress, scene) {

        // 新しい補間点を得る。
        var value = this.polator.polate(progress);

        // 変化量を取得した後、前回の補間点として取っておく。
        var change = value - this.previous;
        this.previous = value;

        // 変化対象のプロパティを取得。
        var prop = this.host.route(this.target);

        // 絶対値への適用としてセッティングされていて、対象値がマイナスなら変化量を反転する。
        if(this.absolute  &&  prop.get() < 0)
            change *= -1;

        // 適用。
        prop.set( prop.get() + change * this.distance );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * デフォルトキー名を定義する。
     */
    get defaultKeyName() {
        return "tween";
    }
}
