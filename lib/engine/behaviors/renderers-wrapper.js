/**
 * レンダラのうち、他のレンダラを内包して変形させるものを収めたファイル。
 *
 * 普通に考えれば内包レンダラはcoreなどのプロパティで持っておくところなのだが、そのプロパティにアクセスするときに core.xxxx などとしなければ
 * ならないのが嫌で Interceptor を使っている。offsetGet やインデクサがあればこんなことしなくて良いのだが…
 */

//==========================================================================================================
/**
 * 他のレンダラによる描画に半透明処理を行うレンダラ。
 */
class AlphaRenderer extends Interceptor {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   実際の描画を行うレンダラ。
     * @param   アルファ(不透明度)の値。0.0-1.0 で指定する。省略時は0.5。
     */
    constructor(target, alpha = 0.5) {
        super(target);

        this.alpha = alpha;
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * paint() に干渉する。
     */
    paint(context, dest) {

        // ショートカット。
        if(this.alpha == 0.0)
            return;

        // セットされたアルファを適用。
        var nature = context.globalAlpha;
        context.globalAlpha *= this.alpha;

        // 描画。
        this.reflectForce("paint", context, dest);

        // アルファを戻す。
        context.globalAlpha = nature;
    }
}


//==========================================================================================================
/**
 * 他のレンダラによる描画を左右反転・上下反転するレンダラ。
 */
class FlipRenderer extends Interceptor {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   実際の描画を行うレンダラ。
     * @param   左右反転なら "flip"、上下反転なら "flop"、両方なら "flip flop" を指定する。
     */
    constructor(target, dir) {
        super(target);

        // 指定された反転方向をフラグで保持する。
        dir = dir.split(" ");
        this.flip = (dir.indexOf("flip") >= 0);
        this.flop = (dir.indexOf("flop") >= 0);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * paint() に干渉する。
     */
    paint(context, dest) {

        // 軸ごとに、反転するなら-1、そうでないなら+1にセットした Point を得る。
        var scale = new Point(this.flip ? -1 : +1, this.flop ? -1 : +1);

        // canvasコンテキストに反転を反映。
        context.scale(scale.x, scale.y);

        // 描画領域も反転するので相殺しておく。
        dest = dest.clone().multi(scale).normalize();

        // 描画。
        this.reflectForce("paint", context, dest);

        // 反転を戻す。
        context.scale(scale.x, scale.y);
    }
}


//==========================================================================================================
/**
 * 他のレンダラによる描画を回転するレンダラ。
 */
class RotateRenderer extends Interceptor {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   実際の描画を行うレンダラ。
     * @param   メンバ変数 pivot の値。
     */
    constructor(target, pivot = null) {
        super(target);

        // ピボットの位置。回転中心を描画領域上のどこに合わせるか。
        // 描画領域の倍率で指定する。例えば左端なら0.0、中心なら0.5、右端なら1.0。
        // nullを指定すると宿主の座標系原点を中心とする。
        if(pivot != null  &&  !(pivot instanceof Point) )  pivot = new Point(pivot);
        this.pivot = pivot;

        // 回転角度(ラジアン)。
        this.angle = 0.0;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * paint() に干渉する。
     */
    paint(context, dest) {

        // 回転 0 の場合のショートカット。
        if(this.angle == 0.0) {
            this.reflectForce("paint", context, dest);
            return;
        }

        // ピボットが指定されているなら、先にピボット位置に translate する。
        if(this.pivot) {
            var pivot = dest.getPoint(this.pivot).int();
            context.translate(pivot.x, pivot.y);
            dest = dest.clone().sub(pivot);
        }

        // セットされた回転を適用。
        context.rotate(this.angle);

        // 描画。
        this.reflectForce("paint", context, dest);

        // 回転を戻す。
        context.rotate(-this.angle);

        // translate していたならそれも戻す。
        if(this.pivot)
            context.translate(-pivot.x, -pivot.y);
    }
}


//==========================================================================================================
/**
 * 他のレンダラによる描画に円によるクリップをかけるレンダラ
 */
class CircleClipper extends Interceptor {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   実際の描画を行うレンダラ。
     * @param   クリッピングする円(Circleオブジェクト)。
     * @param   外側をクリッピングするならtrueを指定する。
     */
    constructor(target, circle, outside = false) {
        super(target);

        // クリップ領域を表すCircleインスタンス。
        this.circle = circle ? circle.clone() : new Circle();

        // 外側をクリップするかどうか。
        this.outside = outside;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * render() に干渉する。本当は paint() でやるところなのだが、scene が欲しいので…
     */
    render(context, scene) {

        // 半径 0 の場合のショートカット。
        if(this.circle.radius == 0) {
            if(this.outside)  this.reflectForce("render", context, scene);
            return;
        }

        // 指定されている円のパスを作成。
        context.beginPath();
        context.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, 0, Math.PI360);

        // 外側をクリップする場合はカメラ外周の矩形パスも追加。
        if(this.outside) {
            var camera = this.host.takeBody(scene);
            context.rect(camera.left, camera.top, camera.width, camera.height);
        }

        // クリップを設定。
        context.save();
        context.clip("evenodd");

        // 描画。
        this.reflectForce("render", context, scene);

        // クリップを解除。
        context.restore();
    }
}


//==========================================================================================================
/**
 * 宿主やその親のscaleをチェックして、反転描画しようとしている場合は反転を解除するレンダラ。
 * テキストなどのように反転すると読めないものを描画する場合に利用する。
 * チェックしているのは実行素子のscaleであって、FlipRendererの有無はチェックしないので注意。
 */
class ReadableRenderer extends Interceptor {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   実際の描画を行うレンダラ。
     */
    constructor(target) {
        super(target);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * paint() に干渉する。
     */
    paint(context, dest) {

        // ルートからのscaleの累積を計算して、各軸 -1, 0, +1 のいずれかで取得する。
        var scale = this.host.globalCoord(Rect.ONE).size.sign();

        // canvasコンテキストに反転を反映。
        context.scale(scale.x, scale.y);

        // 描画領域も反転するので相殺しておく。
        dest = dest.clone().multi(scale).normalize();

        // 描画。
        this.reflectForce("paint", context, dest);

        // 反転を戻す。
        context.scale(scale.x, scale.y);
    }
}
