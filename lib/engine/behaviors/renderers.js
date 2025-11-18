/**
 * Executantの描画を行うビヘイバー(レンダラ)を収めたファイル。
 */

//==========================================================================================================
/**
 * レンダラクラスの基底。
 */
class Renderer extends Behavior {

    //------------------------------------------------------------------------------------------------------
    /**
     * 描画を実行する。
     *
     * @param   描画先となる CanvasRenderingContext2D
     * @param   描画先キャンバスとタイミングを管理しているシーンオブジェクト
     */
    render(context, scene) {

        // 基底では getDest() で得られる領域を...
        var dest = this.getDest(scene);

        // paint() で描画する。
        if(dest)
            this.paint(context, dest);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 描画先の領域を取得する。
     *
     * @param   描画先キャンバスとタイミングを管理しているシーンオブジェクト
     * @return  描画先の領域を表す Rect。不明な場合は null。
     */
    getDest(scene) {

        // 基底では宿主のボディ領域を使う
        return this.host.needBehavior("body", NaturalBody).getRect();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された領域に対して描画する。
     *
     * @param   描画先となる CanvasRenderingContext2D
     * @param   描画先の領域を表す Rect。
     */
    paint(context, dest) {

        // 基底としては黒い矩形で塗りつぶす。fillRect() はクリップが効かないので使わない。
        context.beginPath();
        context.rect(dest.left, dest.top, dest.width, dest.height);
        context.fillStyle = "black";
        context.fill();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 描画素材などから考えられる自然な描画範囲の大きさを Point で表す。
     * ボディの大きさが自主的に定められることのない NaturalBody などによって参照される。
     */
    get naturalSize() {

        // 基底では根拠のない値を返すので、描画素材を持っているレンダラではそのサイズなどを返すと良いだろう。
        return new Point(100, 100);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * デフォルトキー名を定義する。
     */
    get defaultKeyName() {
        return "renderer";
    }
}


//==========================================================================================================
/**
 * 宿主のボディビヘイバが返す領域を指定されたスタイルで塗りつぶすレンダラ。
 */
class FillRenderer extends Renderer {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   塗りつぶしに使うスタイル。CanvasRenderingContext2D.fillStyle にセットできる値。
     */
    constructor(style) {
        super();

        this.style = style || "green";
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * paint() をオーバーライド。
     */
    paint(context, dest) {

        // fillRect() はクリップが効かないので使わない。
        context.beginPath();
        context.rect(dest.left, dest.top, dest.width, dest.height);
        context.closePath();
        context.fillStyle = this.style;
        context.fill();
    }
}


//==========================================================================================================
/**
 * 宿主のボディビヘイバが返す領域を指定された線形グラデーションで塗りつぶすレンダラ。
 * ボディ矩形を元にグラデーションの形を決める。ボディ矩形に依りたくない場合は、普通にグラデーションを作成
 * FillRenderer を使うと良いだろう。
 */
class GradientRenderer extends Renderer {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   [0, 0] を起点とした場合の、グラデーション方向の向きと長さを決める終端をPointで表す。
     *          たとえば [1, 1] を指定すると、宿主のボディ領域の左上から右下方向になるし、[0, 1] を指定すると上から下方向になる。
     *          また、[0.5, 0.5] と指定すると左上から中央までが色変化の対象となる。
     * @param   グラデーションの色ノードを、オフセット⇒色⇒オフセット⇒色⇒... の順で指定した配列。
     *          例えば、赤⇒青⇒緑 と変化するなら [0.0, "red", 0.5, "blue", 1.0, "green"] となる。
     */
    constructor(end, stops) {
        super();

        this.end = end;
        this.stops = stops;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * paint() をオーバーライド。
     */
    paint(context, dest) {

        // グラデーション方向と長さを決める矩形を取得する。
        var gradrect = dest.clone();
        gradrect.size.multi(this.end);

        // グラデーションを作成。
        var grad = context.createLinearGradient(gradrect.left, gradrect.top, gradrect.right, gradrect.bottom);

        // 指定された色ノードを追加する。
        for(var i = 0 ; i < this.stops.length ; i += 2)
            grad.addColorStop(this.stops[i], this.stops[i+1]);

        // 描画。fillRect() はクリップが効かないので使わない。
        context.beginPath();
        context.rect(dest.left, dest.top, dest.width, dest.height);
        context.fillStyle = grad;
        context.fill();
    }
}


//=========================================================================================================
/**
 * 宿主が text プロパティで持つ文字列を、宿主のpositionを起点に描画するレンダラ。
 * 宿主のボディは無視される。横揃えや縦揃えの起点はpositionのみだし、クリップなどもされない。
 */
class TextRenderer extends Renderer {

    //---------------------------------------------------------------------------------------------------------
    /**
     * @param   フォント
     * @param   サイズ(px)。一行の行高さともなる。
     * @param   描画時のstyle
     * @param   行間。マイナスも可能。
     */
    constructor(font, size, style, space) {
        super();

        this.font = font || "monospace";
        this.size = size || 36;
        this.style = style || "black";
        this.space = space || 0;

        // 横揃え(left, center, right)と縦揃え(top, middle, bottom)。
        // それぞれ宿主のpositionを基準にする。
        this.halign = "left";
        this.valign = "top";
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 実際に描画するテキスト。
     */
    get renderedText() {

        // アタッチされていないと処理しようがない...
        if( !this.host )
            return "";

        // セットし忘れているのはよくあることなので、undefined はその旨表示する。
        if(this.host.text === undefined)
            return "undefined";

        // でもnullは空文字とする。
        if(this.host.text === null)
            return "";

        // 基本はもちろんセットされているままなのだが、必ずプリミティブ文字列とする。
        return "" + this.host.text;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 自然な描画サイズをオーバーライド。宿主のテキストを参照して求める。
     */
    get naturalSize() {

        // テキストは不変な場合も多いだろうから、キャッシュすることにする。
        if(this._currentText != this.renderedText) {

            this._currentText = this.renderedText;

            // 幅を求めるのに2dコンテキストが必要なのでなんとか取得する。
            var context = this.host.getScene().context;
            context.font = `${this.size}px "${this.font}"`;

            // 描画テキストを行ごとに分解。
            var texts = this.renderedText.split("\n");

            // 行ごとに幅を求めて最大値を取る。
            var widths = texts.map( (val) => context.measureText(val).width );
            var width = Math.max( ...widths )

            // 高さを求める。最後の1/3がないと、アルファベットなどは下が少し切れてしまう。
            var height = texts.length * (this.size + this.space) - this.space + this.size/3;

            // これが描画サイズとなる。
            this._currentSize = new Point(width, height);
        }

        return this._currentSize;
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * render() をオーバーライド。
     */
    render(context, scene) {

        // 描画位置を決定。とりあえずは宿主のポジションなのだが...
        var cursor = this.host.getCoord(this.host.position);

        // 縦揃えによっては、y を調節する。
        if(this.valign != "top") {

            var height = this.naturalSize.y;
            switch(this.valign) {
                case "middle":  cursor.y -= height/2;   break;
                case "bottom":  cursor.y -= height;     break;
            }
        }

        // テキストを描画。
        this.renderText(context, cursor);
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * 指定された位置を起点に文字列を描画する。
     *
     * @param   描画先となる CanvasRenderingContext2D
     * @param   起点となるPoint
     */
    renderText(context, cursor) {

        cursor = cursor.clone();

        // canvasコンテキストの設定。
        context.font = `${this.size}px "${this.font}"`;
        context.fillStyle = this.style;
        context.textBaseline = "top";
        context.textAlign = this.halign;

        // 一行ずつ描画する。
        for( var text of this.renderedText.split("\n") ) {
            context.fillText(text, cursor.x, cursor.y);
            cursor.y += this.size + this.space;
        }
    }
}


//=========================================================================================================
/**
 * 宿主が text プロパティで持つ文字列をそのボディ領域に描画するレンダラ。
 * 横揃えや縦揃えがボディに対して作用するようになり、ボディ領域でのクリッピングも行われる。
 */
class BodyTextRenderer extends TextRenderer {

    //---------------------------------------------------------------------------------------------------------
    /**
     * render() については TextRenderer でオーバーライドしている内容を迂回する必要がある。
     */
    render(context, scene) {

        return Renderer.prototype.render.call(this, context, scene);
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * paint() をオーバーライド。
     */
    paint(context, dest) {

        // 描画位置を初期化。
        var cursor = new Point();

        // X軸。
        switch(this.halign) {
            case "left":    cursor.x = dest.left;       break;
            case "center":  cursor.x = dest.center.x;   break;
            case "right":   cursor.x = dest.right;      break;
        }

        // Y軸。変数 height に文字列の描画高さを求めてから決める。
        var height = this.naturalSize.y;
        switch(this.valign) {
            case "top":     cursor.y = dest.top;                    break;
            case "middle":  cursor.y = dest.center.y - height/2;    break;
            case "bottom":  cursor.y = dest.bottom - height;        break;
        }

        // 描画先の領域でクリップを設定。
        context.save();
        context.beginPath();
        context.rect( ...dest.clone().int().spec() );
        context.clip();

        // テキストを描画。
        this.renderText(context, cursor);

        // クリップを解除。
        context.restore();
    }
}
