
/**
 * 二次元矩形を表すクラス。
 */
class Rect {

    //-----------------------------------------------------------------------------------------------------
    static get ZERO() {
        return new Rect(0, 0, 0, 0);
    }
    static get ONE() {
        return new Rect(0, 0, 1, 1);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 指定された関数を、引数にX軸、Y軸を与えて二度実行する。
     *
     * @param   コールバック関数。以下の4つの引数が与えられて二回実行される。
     *              1.  "x" か "y"
     *              2.  "width" か "height"
     *              3.  "left" か "top"
     *              4.  "right" か "bottom"
     *
     * 例)
     *      // left to right = width on x
     *      // top to bottom = height on y
     *      // と出力される。
     *      Rect.forAxis((axis, dimension, head, tail) => {
     *          console.log( `${head} to ${tail} = ${dimension} on ${axis}` );
     *      });
     */
    static forAxis(func) {

        func("x", "width", "left", "right");
        func("y", "height", "top", "bottom");
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * インスタンス作成メソッド。
     */

    /**
     * 左上座標と右下座標で作成する。引数規則は normalizeArgs を参照。
     */
    static byCorner(...args) {

        Rect.normalizeArgs(args);

        return new Rect(args[0], args[1], args[2] - args[0], args[3] - args[1]);
    }

    /**
     * 中心座標とサイズで作成する。引数規則は normalizeArgs を参照。
     */
    static byCenter(...args) {

        Rect.normalizeArgs(args);

        return new Rect(args[0] - args[2]/2, args[1] - args[3]/2, args[2], args[3]);
    }

    /**
     * 中心座標と半径で作成する。引数規則は normalizeArgs を参照。
     */
    static byRadius(...args) {

        Rect.normalizeArgs(args);

        return new Rect(args[0] - args[2], args[1] - args[3], args[2]*2, args[3]*2);
    }

    /**
     * 原点位置の割合とサイズで作成する。
     * たとえば原点位置0.2、サイズ10で作成した場合、left-top(-2, -2), size(10, 10) の矩形になる(原点が左上から0.2の割合の位置にある)。
     * 引数規則は normalizeArgs を参照。
     */
    static byPivot(...args) {

        Rect.normalizeArgs(args);

        return new Rect(args[2] * -args[0], args[3] * -args[1], args[2], args[3]);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 矩形を指定する引数の正規化を行い、左上X, Y、幅、高さが第0～3要素に格納されるようにする。
     * publicメソッドとして外部からも呼ばれる。
     *
     * 以下の引数リストがすべて等価になるように正規化を行う。
     *
     *      (1, 2, 3, 4)
     *      (1, 2, new Point(3, 4))
     *      (new Point(1, 2), 3, 4)
     *      (new Point(1, 2), new Point(3, 4))
     * また、次のようになる。
     *      ()  =>          (0, 0, 0, 0)
     *      (1)  =>         (1, 1, 0, 0)
     *      (1, 2)  =>      (1, 1, 2, 2)
     *      (1, 2, 3)  =>   (1, 2, 3, 3)
     *      (1, new Point(3, 4))  =>    (1, 1, 3, 4)
     *      (1, 2, new Point(3, 4))  => (1, 2, 3, 4)
     *      (1, null, 3)  =>            (1, 1, 3, 3)
     *      (1, null, 3, null)  =>      (1, 1, 3, 3)
     * null や undefined はその引数を指定していないのと同じ扱い。
     *      (null) =>       (0, 0, 0, 0)
     *      (null, null) => (0, 0, 0, 0)
     *      (1, null) =>    (1, 1, 0, 0)
     *      (1, 2, null)  =>        (1, 1, 2, 2)
     *      (1, 2, null, null)  =>  (1, 1, 2, 2)
     */
    static normalizeArgs(args) {

        // 一つ目がRectなら展開してリターン。
        if(args[0] instanceof Rect) {
            args[3] = args[0].height;
            args[2] = args[0].width;
            args[1] = args[0].top;
            args[0] = args[0].left;
            return;
        }

        // ショートカット。undefinedが明示されているとこれは誤爆になるんだけど…実際問題、それはないだろ…
        if(args.length == 4)
            return;

        // 第二引数が Point なのは二つ目の x,y ということ。
        if(args[1] instanceof Point) {
            args[2] = args[1];
            args[1] = undefined;
        }

        // 第三、四がともにない場合は、第二引数を第三にスライドする。
        if(args[2] == undefined  &&  args[3] == undefined) {
            args[2] = args[1];
            args[1] = undefined;
        }

        // これで [0], [1] を正規化出来る。
        Point.normalizeArgs(args);

        // あとは [2] と [3]。
        if(args[2] instanceof Point)    [ args[2], args[3] ] = args[2];
        if(args[2] == undefined)        args[2] = 0;
        if(args[3] == undefined)        args[3] = args[2];
    }


    // インスタンスメンバ
    //=====================================================================================================

    //-----------------------------------------------------------------------------------------------------
    /**
     * 引数に与えられた左上座標とサイズでインスタンスを作成する。引数規則は normalizeArgs を参照。
     */
    constructor(...args) {

        this.lt =   new Point();
        this.size = new Point();

        this.put(...args);
    }

    /**
     * このインスタンスの矩形を、引数に与えられた左上座標とサイズにセットする。引数規則は normalizeArgs を参照。
     */
    put(...args) {

        Rect.normalizeArgs(args);

        this.lt.put(args[0], args[1]);
        this.size.put(args[2], args[3]);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 四辺の位置、幅・高さを表すプロパティ。
     * 四辺の位置を代入した場合は他の辺の位置が変わらないようにサイズが調整される。サイズを代入した場合は右下座標が変更される。
     */
    get left() {
        return this.lt.x;
    }
    set left(value) {
        this.size.x -= value - this.lt.x;
        this.lt.x = value;
    }

    get top() {
        return this.lt.y;
    }
    set top(value) {
        this.size.y -= value - this.lt.y;
        this.lt.y = value;
    }

    get right() {
        return this.lt.x + this.size.x;
    }
    set right(value) {
        this.size.x = value - this.lt.x;
    }

    get bottom() {
        return this.lt.y + this.size.y;
    }
    set bottom(value) {
        this.size.y = value - this.lt.y;
    }

    get width() {
        return this.size.x;
    }
    set width(value) {
        this.size.x = value;
    }

    get height() {
        return this.size.y;
    }
    set height(value) {
        this.size.y = value;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 右上角の座標を表す Point(right-topの略)。代入した場合はサイズを保ったまま矩形の位置が移動する。
     */
    get rt() {

        return new Point(this.right, this.top);
    }
    set rt(value) {

        this.lt.x = value.x - this.width;
        this.lt.y = value.y;
    }

    /**
     * 右下角の座標を表す Point(right-bottomの略)。代入した場合はサイズを保ったまま矩形の位置が移動する。
     */
    get rb() {

        return new Point(this.right, this.bottom);
    }
    set rb(value) {

        this.lt.x = value.x - this.width;
        this.lt.y = value.y - this.height;
    }

    /**
     * 左下角の座標を表す Point(left-bottomの略)。代入した場合はサイズを保ったまま矩形の位置が移動する。
     */
    get lb() {

        return new Point(this.left, this.bottom);
    }
    set lb(value) {

        this.lt.x = value.x;
        this.lt.y = value.y - this.height;
    }

    /**
     * 中心の座標を表す Point。代入した場合はサイズを保ったまま矩形の位置が移動する。
     */
    get center() {

        return this.getPoint(0.5);
    }
    set center(value) {

        this.lt.x = value.x - this.width/2;
        this.lt.y = value.y - this.height/2;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 右下を固定したまま左上を動かす。
     *
     * @param   新しい左上の座標。Point.normalizeArgs() で説明している通り。
     */
    cap(...args) {

        var move = this.lt.clone().sub(...args);

        this.lt.put(...args);
        this.size.add(move);
        return this;
    }

    /**
     * 右下を固定したまま左上をスライドさせる。プラスで右下へ、マイナスで左上へ動く。
     *
     * @param   Point.normalizeArgs() で説明している通り。
     */
    slideCap(...args) {

        this.lt.add(...args);
        this.size.sub(...args);
        return this;
    }

    /**
     * 左上を固定したまま右下を動かす。
     *
     * @param   新しい右下の座標。Point.normalizeArgs() で説明している通り。
     */
    mug(...args) {

        var rb = new Point(...args);

        this.size.put( rb.sub(this.lt) );
        return this;
    }

    /**
     * 左上を固定したまま右下をスライドさせる。プラスで右下へ、マイナスで左上へ動く。
     *
     * @param   Point.normalizeArgs() で説明している通り。
     */
    slideMug(...args) {

        this.size.add(...args);
        return this;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 指定された値だけ矩形の四辺を動かして膨らませたり縮めたりする。
     * 例えば 5 を指定すると、両側が 5 ずつ膨らむため 10 膨らむことになる。縮ませたい場合はマイナスの値を指定する。
     *
     * @param   Point.normalizeArgs() で説明している通り。
     */
    swell(...args) {

        var arg = new Point(...args);

        this.lt.sub(arg);
        this.size.add( arg.multi(2) );
        return this;
    }

    /**
     * swell() と同じだが、絶対量ではなく倍率で指定する。
     * 例えば 2 を指定すると、中心を固定してサイズが倍になる。
     *
     * @param   Point.normalizeArgs() で説明している通り。
     */
    rateSwell(...args) {

        var rate = new Point(...args);
        this.swell( rate.sub(1).multi(this.width, this.height).divide(2) );

        return this;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 数値かPointによる四則演算を定義する。加算と減算は、サイズはそのままで矩形の位置だけが移動する。
     * 乗算と除算は、例えば2をかけると、各辺の原点からの距離が2倍になる。自然とサイズも2倍になる。
     *
     * @param   Point.normalizeArgs() で説明している通り。
     */

    add(...args) {

        this.lt.add(...args);
        return this;
    }

    sub(...args) {

        this.lt.sub(...args);
        return this;
    }

    multi(...args) {

        this.lt.multi(...args);
        this.size.multi(...args);
        return this;
    }

    divide(...args) {

        this.lt.divide(...args);
        this.size.divide(...args);
        return this;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 座標・サイズの小数部分を切り捨てる。
     */
    int() {

        this.lt.int();
        this.size.int();
        return this;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 引数に指定された座標が矩形の中にあるかどうかを返す。
     */
    inside(point) {

        return (
            this.left <= point.x  &&  point.x < this.right  &&  this.top <= point.y  &&  point.y < this.bottom
        );
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 引数に指定された矩形と重複している部分があるかどうかを返す。
     */
    collide(rect) {

        return !(
            rect.right <= this.left  ||  rect.bottom <= this.top  ||  this.right <= rect.left  ||  this.bottom <= rect.top
        );
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * サイズがマイナスになっている虚状態を解消する。
     */
    normalize() {

        Point.forAxis( (axis) => {
            if(this.size[axis] < 0) {
                this.lt[axis] += this.size[axis];
                this.size[axis] *= -1;
            }
        } );

        return this;
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * この矩形が引数に指定された矩形と等しいかどうかを返す。
     */
    equals(rect) {

        return this.lt.equals(rect.lt)  &&  this.size.equals(rect.size);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 矩形の左上から、引数で指定された比率分、右下に向かった座標を返す。
     * 例)
     *      var rect = new Rect(100, 100, 100, 100);
     *      rect.getPoint(0.0);         // 100, 100
     *      rect.getPoint(0.5);         // 150, 150
     *      rect.getPoint(1.0);         // 200, 200
     *      rect.getPoint(0.5, 0.0);    // 150, 100
     *      rect.getPoint(0.0, 0.5);    // 100, 150
     *
     * @param   比率。引数規則は Point.normalizeArgs(args) で説明している通り。
     * @return  指定された位置を表す Point。
     */
    getPoint(...args) {

        Point.normalizeArgs(args);

        return new Point(this.left + this.width * args[0], this.top + this.height * args[1]);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 矩形内の座標をランダムに選択して返す。
     *
     * @return  矩形内に位置するPoint。座標は実数になっているので、整数で必要ならば戻り値から int() を呼ぶこと。
     */
    random() {

        return this.getPoint( Math.random(), Math.random() );
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * この矩形と引数に指定された矩形が重複して構成される矩形を返す。
     * 重複していない場合は虚状態の矩形になる。
     */
    intersect(rect) {

        return Rect.byCorner(
            Math.max(this.left, rect.left), Math.max(this.top, rect.top),
            Math.min(this.right, rect.right), Math.min(this.bottom, rect.bottom)
        );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 座標軸上に引数で指定されたサイズのグリッド升を設定して、この矩形の四隅が位置するグリッドの序数を使って新たな矩形を作成する。
     *
     * 例)
     *      var rect = new Rect(5, 5, 20, 20);  // 右下は [25, 25]
     *      var grided = rect.grid(10);         // 左上[0, 0] 右下[3, 3]
     *
     *      var rect = new Rect(0, 0, 20, 20);  // 右下は [20, 20]
     *      var grided = rect.grid(10);         // 左上[0, 0] 右下[2, 2]
     *
     *      var rect = new Rect(0, 0, 21, 21);  // 右下は [21, 21]
     *      var grided = rect.grid(10);         // 左上[0, 0] 右下[3, 3]
     */
    grid(size) {

        var x = Math.floor(this.left / size);
        var y = Math.floor(this.top / size);
        var r = Math.floor((this.right - 1) / size) + 1;
        var b = Math.floor((this.bottom - 1) / size) + 1;

        return Rect.byCorner(x, y, r, b);
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * x, y, w, h の順番で配列に格納された諸元を返す。
     */
    spec() {

        return [this.left, this.top, this.width, this.height];
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * 座標を出力する。デバッグ用。
     */
    explain() {

        return `left-top:${this.lt.explain()}, size:${this.size.explain()}, right-bottom:${this.rb.explain()}`;
    }

    //-----------------------------------------------------------------------------------------------------
    toString() {

        return "[object Rect] " + this.explain();
    }
}
