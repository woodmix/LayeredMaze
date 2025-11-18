/**
 * 与えられた「動き」の定義に従って、任意の時間における位置を取得するユーティリティ「ウォーカー」を定義するファイル。
 *
 * 例1) 座標 [0,0] から [200,200] に等速で移動する場合の、進行率30%における位置を取り出す。
 *
 *      // 直線軌道ウォーカーの作成。
 *      var walker = new LineWalker({dest:new Point(200, 200)});
 *
 *      // 進行率30%における位置を取り出す。
 *      var position = walker.walk(0.3);    // 60,60
 *
 *      // すべてのウォーカーはスタート地点が[0,0]になっている。
 *      // 軌道を [100,100] だけ動かして、スタートを[100,100]、ゴールを[300,300]のようにしたい場合は次のようにする。
 *      var walker = new LineWalker({dest:new Point(200, 200), offset:new Point(100, 100)});
 *      var position = walker.walk(0.3);    // 160,160
 *
 * 例2) 補間器を調整してイーズインするようにする。
 *
 *      // polator を指定する。例1のように省略した場合は LinearPolator が使われる。
 *      var walker = new LineWalker({dest:new Point(200, 200), polator:new EaseinPolator()});
 *
 *      // 最初は速く、徐々に減速していく。
 *      var position = walker.walk(0.1);    //  54.2,  54.2
 *      var position = walker.walk(0.2);    //  97.6,  97.6
 *      var position = walker.walk(0.3);    // 131.4, 131.4
 *      var position = walker.walk(0.4);    // 156.8, 156.8
 *      var position = walker.walk(0.5);    // 175.0, 175.0
 *      var position = walker.walk(0.6);    // 187.2, 187.2
 *      var position = walker.walk(0.7);    // 194.6, 194.6
 *      var position = walker.walk(0.8);    // 198.4, 198.4
 *      var position = walker.walk(0.9);    // 199.8, 199.8
 *
 * 例3) 進行率が0%～100%から外れている場合の処理。
 *
 *      // ストップする。デフォルト。
 *      var walker = new LineWalker({dest:new Point(200, 200), polator:new StopPolator()});
 *      var position = walker.walk(1.3);    // 200,200
 *      var position = walker.walk(-0.3);   // 0,0
 *
 *      // ピンポンのように行ったり来たりする。
 *      var walker = new LineWalker({dest:new Point(200, 200), polator:new PingpongPolator()});
 *      var position = walker.walk(1.1);    // 180,180
 *      var position = walker.walk(-0.1);   // 20,20
 *
 *      // ループする。
 *      var walker = new LineWalker({dest:new Point(200, 200), polator:new LoopPolator()});
 *      var position = walker.walk(1.2);    // 40,40
 *      var position = walker.walk(-0.2);   // 160,160
 */

//==========================================================================================================
/**
 * ウォーカーの基底クラス。普通は派生クラスを利用する。このクラスのままだと、point() が進行率に関わらず不動の
 * 座標を返す実装になっているので、位置が動かないウォーカーとなる。
 */
class Walker {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   動きを定義する連想配列。基本的に派生クラスで定められるが、以下のキーは共通して使える。
     *              offset      軌道を一定量スライドさせたい場合は、そのスライド量をPointで指定する。
     *              polator     使用する補間器。インスタンスを直接指定することもできるが、クラス名を指定することもできる。その場合は
     *                          "EaseinPolator" なら "easein" とする。省略時は "linear"。
     *
     *          ここで指定されたキーはインスタンスのプロパティとして参照できる。
     *              例)
     *                  var walker = new LineWalkder({dest:new Point(100, 100), offset:new Point(50, 50), polator:"easein"});
     *                  console.log(walker.dest);       // Point(100, 100)
     *                  console.log(walker.offset);     // Point(50, 50)
     *                  console.log(walker.polator);    // EaseinPolator
     */
    constructor(definition) {

        // デフォルトのプロパティをセット。
        this.polator = "linear";
        this.offset = Point.ZERO;

        // 指定されたキーを保持する。
        this.merge(definition || {});

        // 補間器の指定を正規化する。
        this.polator = Interpolator.normalize(this.polator);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された進行率における位置を取り出す。
     *
     * @param   進行率。0%を0.0、100%を1.0で表現する。
     * @return  指定された進行率における位置(Pointオブジェクト)。
     */
    walk(progress) {

        // 指定された進捗率に補間器を適用。
        progress = this.polator.polate(progress);

        // 指定された進行率における位置を取得、offset を適用してリターン。
        return this.point(progress).add(this.offset);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * [0,0] を出発点としたときの、指定された進行率における位置を返す。polator や offset による操作は加味しない。
     *
     * @param   進行率。
     * @return  指定された進行率における位置(Pointオブジェクト)。
     */
    point(progress) {

        // 基底では進行率に関わらず不動の座標を返すので、このウォーカーは位置が動かないウォーカーとなる。
        return Point.ZERO;
    }
}


//==========================================================================================================
/**
 * 直線軌道を処理するウォーカー。
 */
class LineWalker extends Walker {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   基底が定めるプロパティに加えて以下のキーを指定する。
     *              dest    終端における座標。Pointかそのコンストラクタに渡せる値で指定する。
     */
    constructor(definition) {

        if( definition  &&  !(definition.dest instanceof Point) )
            definition.dest = new Point(definition.dest);

        super(definition);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。指定された進行率における位置を返す。
     */
    point(progress) {

        return this.dest.clone().multi(progress);
    }
}


//==========================================================================================================
/**
 * 真円軌道を処理するウォーカー。
 */
class ArcWalker extends Walker {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   基底が定めるプロパティに加えて以下のキーを指定する。
     *              center  中心座標
     *              rotate  終端における始端からの回転角度。時計回りならプラス、反時計回りならマイナスで指定する。
     */
    constructor(definition) {
        super(definition);

        // 原点から中心点への距離が半径となる。
        this.radius = this.center.distance();

        // 中心から見たときの原点への角度を求める。
        this.angle = (new Point(-this.center.x, -this.center.y)).angle();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。指定された進行率における位置を返す。
     */
    point(progress) {

        // 指定された進行率における角度を取得。
        var angle = this.angle + (this.rotate * progress);

        // その角度における単位円上の座標を取得して、半径・中心点から戻り値となる座標を取得する。
        return Point.circle(angle).multi(this.radius).add(this.center);
    }
}


//==========================================================================================================
/**
 * X, Y 座標を独立したルールで取得して組み合わせるウォーカー。
 */
class AxisWalker extends Walker {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   基底が定めるプロパティに加えて以下のキーを指定する。
     *              x       X座標。固定値かpolatorを指定する。
     *              x_apex  x にpolatorを指定したとき、それが1.0を返すときのX座標を指定する。
     *              y       同様にY座標。
     *              y_apex
     */
    constructor(definition) {

        definition = {x:0, x_apex:1, y:0, y_apex:1}.merge(definition);

        // 補間器の指定を正規化する。
        if(typeof definition.x == "string") definition.x = Interpolator.normalize(definition.x);
        if(typeof definition.y == "string") definition.y = Interpolator.normalize(definition.y);

        super(definition);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。指定された進行率における位置を返す。
     */
    point(progress) {

        var x = (this.x instanceof Interpolator) ? this.x.polate(progress) * this.x_apex : this.x;
        var y = (this.y instanceof Interpolator) ? this.y.polate(progress) * this.y_apex : this.y;

        return new Point(x, y);
    }
}


//==========================================================================================================
/**
 * 他のウォーカーを直列に並べて進行率によって切り替えながら軌道を決定するウォーカー。
 *
 * 基本的には次のように、他のウォーカーのインスタンスをパラメータとするのだが…
 *
 *      var walker = new CoalesceWalker({
 *          offset: new Point(100, 100),
 *          rail: {
 *
 *              // 33%までは右に100px移動。
 *               33: new LineWalker({dest:new Point(100, 0)}),
 *
 *              // 次に66%までは下に100px移動。
 *               66: new LineWalker({dest:new Point(0, 100)}),
 *
 *              // 最後に左に100px移動。
 *              100: new LineWalker({dest:new Point(100, 0)})
 *          }
 *      });
 *
 * 次のように他のウォーカーのパラメータのみでも初期化できる。ウォーカーのクラス名は "type" プロパティで指定する。
 *
 *      var walker = new CoalesceWalker({
 *          offset: new Point(100, 100),
 *          rail: {
 *               33: {type:"line", dest:new Point(100, 0)},
 *               66: {type:"line", dest:new Point(0, 100)},
 *              100: {type:"line", dest:new Point(100, 0)}
 *          }
 *      });
 *
 * ちなみに、直線軌道であれば "dest" となる座標だけで指定できる。
 *
 *      var walker = new CoalesceWalker({
 *          offset: new Point(100, 100),
 *          rail: {
 *               33: new Point(100, 0),
 *               66: new Point(0, 100),
 *              100: new Point(100, 0)
 *          }
 *      });
 *
 * このウォーカーを入れ子にすることもできる。
 *
 *      var walker = new CoalesceWalker({
 *          polator: "pingpong",
 *          rail: {
 *               20: {type:"line", dest:new Point(200, 200)},
 *               80: {
 *                  type: "coalesce",
 *                  polator: "easein",
 *                  rail: {
 *                       33: {type:"line", dest:new Point(200, 0)},
 *                       66: {type:"line", dest:new Point(0, 200)},
 *                      100: {type:"line", dest:new Point(200, 0)},
 *                  },
 *              },
 *              100: {type:"line", dest:new Point(200, 200)},
 *          },
 *      });
 */
class CoalesceWalker extends Walker {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   基底が定めるプロパティに加えて以下のキーを指定する。
     *              rail    直列に並べる他のウォーカーか、そのパラメータ。
     *                      キーに、そのウォーカーが何パーセントまでを支配するのかを示す。
     */
    constructor(definition) {
        super(definition);

        // 最初の "offset" を保持する。
        var start = Point.ZERO;

        // "rail" に指定されたキーを一つずつ見ていく。
        for(var k in this.rail) {

            // ウォーカーでないならば…
            if( !(this.rail[k] instanceof Walker) ) {

                // 一旦パラメータを取得。
                var params = this.rail[k];

                // 座標のみで指定されているならば直線軌道のウォーカーを使う。
                if(params instanceof Point)
                    params = {"type":"line", "dest":params};

                // ウォーカーの正確なクラス名を取得。
                var type = params.type.ucfirst() + "Walker";
                delete params.type;

                // ウォーカー作成。
                this.rail[k] = new (eval(type))(params);
            }

            // offset を上書き。
            this.rail[k].offset = start;

            // 次の"offset"とするため、1.0の時の座標を取得しておく。
            start = this.rail[k].walk(1.0);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。指定された進行率における位置を返す。
     */
    point(progress) {

        // 進行率をパーセンテージに直す。
        progress = progress * 100;

        // 指定の進行率が含まれるエントリのキーを取得する。
        var [prev, next] = this.getStepBound(progress);

        // そのエントリがカバーしている進行率の幅を取得。
        var width = next - prev;

        // その幅において、指定された進行率は何パーセント進行したものかを取得。
        var rate = (progress - prev) / width;

        // 該当のウォーカーから座標を得る。
        return this.rail[next].walk(rate);
    }

    /**
     * メンバ変数 rail に含まれているキーから、指定の進行率が含まれるステップの両端のキーを返す。
     */
    getStepBound(progress) {

        // キーの一覧を数値順として取得。
        var steps = this.rail.keys().numsort();

        // 指定された進行率が 0 未満の場合は最初のステップを使う。
        if(progress < 0)  return [0, steps[0]];

        // 最初のキーを 0 として、キーを一つずつ見ていく。
        var prev = 0, i = 0;
        for(var next of steps) {

            // 指定の進行率を超えるキーを見つけた時点で抜ける。
            if(progress <= next)  break;

            // 最後のキーまで見てしまった場合も抜ける。
            if(++i == steps.length)  break;

            // 直前のキーとして覚えておく。
            prev = next;
        }

        return [prev, next];
    }
}
