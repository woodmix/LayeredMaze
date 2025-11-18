/**
 * 実行素子の移動を行うビヘイバー(移動器)を収めたファイル。
 */

//==========================================================================================================
/**
 * 移動器の基底クラス。
 */
class Mover extends Behavior {

    //------------------------------------------------------------------------------------------------------
    /**
     * デフォルトキー名を定義する。
     */
    get defaultKeyName() {
        return "mover";
    }
}

//==========================================================================================================
/**
 * セットされた座標へ移動を行うビヘイバ。
 */
class DestineMover extends mixin(Mover, FinishTrait) {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   目的地の座標。Pointインスタンス。
     * @param   スピード(px/s)。
     *
     * 引数なしでコールすることもできる。その場合は別途メンバをセットすること。
     */
    constructor(dest, speed) {
        super();

        // 継承によって以下のプロパティも定義されている。
        // this.onfinish        目標に到達したら呼び出される宿主のメソッド名かコールバック関数。
        // this.autoremove      到達時に自身を削除するなら true を指定する。

        // スピード(px/ms)。
        this.speed = speed / 1000;

        // 目的座標。
        this.dest = dest ? dest.clone() : new Point();

        // 最初のフレーム時のみ、behaveが処理されないようにする。
        this.needReset();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとに実行される。
     */
    behave(scene) {

        // スピード 0 ならショートカット。
        if(!this.speed)
            return;

        // 宿主の今の位置から目的地へのベクトルとその長さ(距離)を取得。
        var vector = this.dest.clone().sub(this.host.position);
        var distance = vector.distance();

        // このフレームでの移動距離を取得。
        var jump = this.speed * scene.delta;

        // 移動。このフレームで目的地に到達出来るなら目的地にぴったり合わせる。
        if(distance <= jump)
            this.host.position.put(this.dest);
        else
            this.host.position.add( vector.multi(jump / distance) );

        // 到達したならfinishを起動。
        if( this.host.position.equals(this.dest) )  this.finish();
    }
}


//==========================================================================================================
/**
 * セットされた角度と速度で移動を行うビヘイバ。
 */
class AngleMover extends Mover {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   角度(ラジアン)。
     * @param   速さ(px/s)。
     */
    constructor(angle, speed) {
        super();

        // 移動方向の角度。
        this.angle = angle;

        // 移動の速さ(px/ms)。
        this.speed = speed / 1000;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとに実行される。
     */
    behave(scene) {

        if( isNaN(this.angle) )
            return;

        var move = Point.circle(this.angle).multi(this.speed * scene.delta);
        this.host.position.add(move);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 移動角度をX軸方向に反転する。
     */
    flip() {

        this.angle = Math.loop(Math.mirror(this.angle, Math.PI90), Math.PI360);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 移動角度をY軸方向に反転する。
     */
    flop() {

        this.angle = Math.loop(Math.mirror(this.angle, Math.PI180), Math.PI360);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 移動角度を、指定された角度の面を向くように反転する。任意の角度の面や球体に対する跳ね返りを行いたいときに利用する。
     * 「指定された角度の面」とは、指定された角度を中心とした180°を言う。たとえば45°を指定したなら -45～135°となる。すでに指定された角度の面を向いている場合は何もしない。
     * 「面を向くように反転」とは、その角度の直交線に対して対称となる角度を取ることを言う。たとえば180°で進んでいるときに45°を指定してflap()したときは90°となる。
     *
     * @param   向きたい面の角度(ラジアン)。
     */
    flap(pivot) {

        if( isNaN(pivot) )
            return;

        // 指定の角度と直交する角度を求める。
        pivot -= Math.PI90;

        // すでに指定の角度の面を向いている場合は何もしない。
        if( Math.inAngle(this.angle, pivot, pivot + Math.PI180) )
            return;

        // 直交角度に対して、現在の移動角度の対称を取る。
        this.angle = Math.loop(Math.mirror(this.angle, pivot), Math.PI360);
    }
}


//==========================================================================================================
/**
 * 引数で指定されたウォーカーを使って移動を行うビヘイバ。
 * ウォーカーが返す座標の前回フレーム時からの変化量を宿主に適用するので、途中で宿主の座標を動かしてもちゃんと引き継がれる。
 */
class WalkMover extends mixin(Mover, ProgressionTrait) {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   移動時に参照するウォーカー。offsetは無視される。
     * @param   何ミリ秒を使ってウォーカーの1往路(0.0-1.0)をたどるか。
     */
    constructor(walker, duration) {
        super();
        this.initializeTimer(duration);

        this.walker = walker;

        // 継承によって以下のプロパティも定義されている。
        // this.onfinish        目標に到達したら呼び出される宿主のメソッド名かコールバック関数。
        // this.autoremove      到達時に自身を削除するなら true を指定する。

        // 最初のフレーム時のみ、behaveが処理されないようにする。
        this.needReset();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。アタッチされた後、最初にbehave()が呼ばれる代わりに呼ばれる。
     */
    reset(scene) {

        // 前回の座標を初期化。
        this.previous = this.walker.walk(0.0);

        // 最終予測地点を取得しておく。
        var vector = this.walker.walk(1.0).sub(this.previous);
        this.final = this.host.position.clone().add(vector);

        // 基底の処理。
        this.super(WalkMover.prototype.reset, scene);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとに実行される。
     */
    tictoc(progress, scene) {

        // ウォーカーの軌道をたどる。
        var point = this.walker.walk(progress);

        // 前回からの変化量分、宿主を動かす。
        this.host.position.add( point.clone().sub(this.previous) );

        // 前回の座標として取っておく。
        this.previous = point;

        // autoremove がセットされているときの最後の移動時、誤差が蓄積して目標地点にぴったり合わさらない可能性があるので、誤差精算しておく。
        // ただし途中で宿主の位置が手動操作されている可能性もあるので、ズレが誤差と判断出来る程度である場合のみに制限する。
        if(progress == 1.0  &&  this.final.manhattan(this.host.position) < 1.0)
            this.host.position.put(this.final);
    }
}


//==========================================================================================================
/**
 * 振動を行うためのムーバー。
 */
class VibrateMover extends WalkMover {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   振動種別。以下のいずれか。
     *              horizontal  横にのみ振動する。
     *              vertical    縦にのみ振動する。
     *              xsquare     縦横に振動する。こんな感じの動き。
     *                              ─→
     *                               ×
     *                              ─→
     * @param   振動にかける時間(ms)
     * @param   振動幅
     * @param   周波数。1秒あたり何周するか。
     * @param   減衰をかけるかどうか。
     */
    constructor(style, duration, radius, frequency, decaying = false) {

        // 振動距離を取り出すためのウォーカーを取得。
        var walker = new AxisWalker();

        // 指定された周波数を取り出す補間器を作成。
        var polator = new RunPolator2("linear", frequency/1000 * duration);
        polator = new LoopPolator(polator);

        // 指定された種別を実現する補間器をウォーカーの X, Y 軸にセット。
        switch(style) {
            case "horizontal":
                walker.x = new JagsinPolator(polator);
                walker.x_apex = radius;
                break;
            case "vertical":
                walker.y = new JagsinPolator(polator);
                walker.y_apex = radius;
                break;
            case "xsquare":
                walker.x = new RunPolator(new JagsinPolator(polator), 0.5);
                walker.x_apex = -radius;
                walker.y = new OffagainPolator(polator);
                walker.y_apex = radius;
                break;
        }

        // 減衰をかける場合はそれぞれの補間器に減衰をセットする。
        if(decaying) {
            if(walker.x instanceof Interpolator)  walker.x = new DecayPolator(walker.x);
            if(walker.y instanceof Interpolator)  walker.y = new DecayPolator(walker.y);
        }

        // これで基底クラスのパラメータが揃う。
        super(walker, duration);

        // autoremove がデフォ。
        this.autoremove = true;
    }
}

/**
 * こんな感じの出力の補間器。VibrateMover の "xsquare" におけるY軸を取り出すためのもの。
 *      +1.0       ─
 *              ／    ＼
 *                      ＼    ／
 *      -1.0               ─
 *            0.0     0.5      1.0
 */
class OffagainPolator extends Interpolator {

    /**
     * @param   チェーン元補完器。本当は基底でやるべきなのだが…暫定措置としてここにある。
     */
    constructor(generator) {
        super();
        this.generator = generator;
        this.looper = new LoopPolator();
    }

    polate(x) {

        // 暫定措置。
        x = this.generator ? this.generator.polate(x) : x;

        // 後続の処理は分かりやすいように左上をスタート地点としているので、ここで補正しておく。
        x -= 0.125;

        // 入力をループで 0.0-1.0 に補正。
        x = this.looper.polate(x);

        // 左上を0.0として出力を 0.0-1.0 で得る。全体を1/4で区切って、動きなし、増加、 動きなし、減少となる。
        switch(true) {
            case x < 0.25:  var y = 0;                  break;
            case x < 0.50:  var y = (x - 0.25) / 0.25;  break;
            case x < 0.75:  var y = +1;                 break;
            default:        var y = (1.0 - x) / 0.25;
        }

        // 0.0-1.0 で得た出力を -1.0-1.1 とする。
        return (y - 0.5) * 2;
    }
}


//==========================================================================================================
/**
 * 移動ビヘイバに摩擦ブレーキを適用するビヘイバ。移動器ではない。
 * 速さを speed というプロパティに持っている移動ビヘイバにしか適用できない。
 */
class SpeedFriction extends Behavior {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   動摩擦係数(px/s2)。1秒で速さがいくつ減衰するか。省略時は 1000。
     * @param   静摩擦係数(px/s)。速さがこれ以下の場合は速さがゼロになる。省略時は 1。
     * @param   適用対象の移動ビヘイバのキー。省略時は "mover"。
     */
    constructor(gruel, stop, target)  {
        super();

        // 指定された引数を保持する。
        this.gruel = (gruel || 1000) / 1000 / 1000;
        this.stop = (stop || 1) / 1000;
        this.target = target || "mover";

        // 最初のフレーム時のみ、behaveが処理されないようにする。
        this.needReset();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとに実行される。
     */
    behave(scene) {

        // 適用対象の移動ビヘイバを取得。
        var mover = this.host.behaviors[this.target];

        // 移動ビヘイバがない、あるいは speed プロパティがないかゼロの場合は処理しない。
        if( !mover  ||  !mover.speed)
            return;

        // 速さがどのくらい減るかを取得。
        var decay = this.gruel * scene.delta;

        switch(true) {

            // speed プロパティが数値の場合はこう。
            case typeof(mover.speed) == "number":
                mover.speed -= decay;
                if(mover.speed <= this.stop)
                    mover.speed = 0;
                break;

            // speed プロパティがPointインスタンスの場合はこう。
            // [未検証]
            // case mover.speed instanceof Point:
            //     var amount = mover.speed.distance();
            //     if(amount <= this.stop)
            //         mover.speed.put(0, 0);
            //     else
            //         mover.speed.multi( (amount - decay) / amount );
            //     break;
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * デフォルトキー名を定義する。
     */
    get defaultKeyName() {
        return "friction";
    }
}


//==========================================================================================================
/**
 * 指定された矩形の内側から出ないようにするビヘイバ。移動器ではない。
 * ブロック崩しのボールがステージの四辺の壁にぶつかるような振る舞いを持たせる。
 */
class InsideSkater extends Behavior {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   動き回るリンクとなるRect。このRectの内側から出ないようになる。
     */
    constructor(rink) {
        super();

        // 引数に指定された矩形を覚えておく。
        this.rink = rink.clone();

        // 跳ね返ったときに起動されるコールバック。
        // 引数には "left", "top", "right", "bottom" のいずれかの文字列が与えられる。
        this.onBound = nothing;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとのアフターフェーズで呼ばれる。
     */
    stay(scene) {

        // 宿主の矩形を取得。
        var body = this.host.behaviors["body"].getRect();
        body = this.host.parentCoord(body);

        // 補正量を初期化。
        var slide = Point.ZERO.clone();

        // 左
        if(body.left < this.rink.left) {
            slide.x = (this.rink.left - body.left) * 2;
            this.onBound("left", this);
        }

        // 上
        if(body.top < this.rink.top) {
            slide.y = (this.rink.top - body.top) * 2;
            this.onBound("top", this);
        }

        // 右
        if(this.rink.right <= body.right) {
            slide.x = (this.rink.right - body.right) * 2;
            this.onBound("right", this);
        }

        // 下
        if(this.rink.bottom <= body.bottom) {
            slide.y = (this.rink.bottom - body.bottom) * 2;
            this.onBound("bottom", this);
        }

        // 計算した補正量を適用する。
        this.host.position.add(slide);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * デフォルトキー名を定義する。
     */
    get defaultKeyName() {
        return "skater";
    }
}
