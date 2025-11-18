/**
 * レンダラのうち、渡されたイメージを描画するものを収めたファイル。
 */

//==========================================================================================================
/**
 * 指定されたイメージを宿主のボディ領域に描画するレンダラ。
 */
class ImageRenderer extends Renderer {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   描画するイメージ。Assetのキー名か、<img> や <canvas>、あるいは ImagePiece インスタンス。
     */
    constructor(image) {
        super();

        this.image = image;
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * 描画するイメージ。
     * セットするときはAssetのキー名か、<img> や <canvas>、あるいは ImagePiece インスタンスを指定する。
     */
    get image() {
        return this._image;
    }
    set image(value) {
        this._image = Asset.needAs(value, CanvasImageSource);
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * paint() をオーバーライド。
     */
    paint(context, dest) {

        context.decalImage(this.image, dest.left, dest.top, dest.width, dest.height);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 自然な描画サイズをオーバーライド。描画するイメージの大きさとする。
     */
    get naturalSize() {

        return new Point(this.image.assumedWidth, this.image.assumedHeight);
    }
}

//=========================================================================================================
/**
 * 指定されたイメージを宿主のボディ領域に敷き詰めるように描画するレンダラ。
 * イメージの左上頂点が宿主の座標点に位置するように合わせられる。
 */
class TileRenderer extends ImageRenderer {

    //---------------------------------------------------------------------------------------------------------
    /**
     * @param   描画するイメージ。Assetのキー名か、<img> や <canvas>、あるいは ImagePiece インスタンス。
     */
    constructor(image) {
        super(image);
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * paint() の実装。
     */
    paint(context, dest) {

        // X, Y軸上でループに回しながらタイル状に描画していく。
        var y = Math.step(dest.top, this.image.assumedHeight);
        for( ; y < dest.bottom ; y += this.image.assumedHeight ) {

            // 描画先Y、描画元Y、描画元高さを取得。
            var dy = y;
            var sy = 0;
            var sh = this.image.assumedHeight;

            // 上端チェック。
            if( dy < dest.top ) {
                sy += dest.top - dy;
                sh -= dest.top - dy;
                dy = dest.top;
            }

            // 下端チェック。
            if( dest.bottom < dy + sh ) {
                sh = dest.bottom - dy;
            }

            // 同様にX軸について処理していく。
            var x = Math.step( dest.left, this.image.assumedWidth );
            for( ; x < dest.right ; x += this.image.assumedWidth ) {

                var dx = x;
                var sx = 0;
                var sw = this.image.assumedWidth;

                // 左端チェック。
                if( dx < dest.left ) {
                    sx += dest.left - dx;
                    sw -= dest.left - dx;
                    dx = dest.left;
                }

                // 右端チェック。
                if( dest.right < dx + sw ) {
                    sw = dest.right - dx;
                }

                // 描画。
                context.decalImage(this.image, sx, sy, sw, sh, dx, dy);
            }
        }
    }
}


//=========================================================================================================
/**
 * 指定されたイメージを9スライスして描画するレンダラ。ImageRenderer から派生している。
 * 宿主のボディを中央エリアで描画してその周辺に残りのエリアを描画するので、実際の描画エリアはボディより大きくなる。
 */
class NineRenderer extends ImageRenderer {

    //---------------------------------------------------------------------------------------------------------
    /**
     * @param   描画するイメージ。Assetのキー名か、<img> や <canvas>、あるいは ImagePiece インスタンス。
     * @param   9スライスの左上領域のサイズをPointで指定する。
     * @param   9スライスの右下領域のサイズをPointで指定する。
     */
    constructor(image, ltsize, rbsize) {
        super(image);

        // この二つはメンバ変数で保持。
        this.ltsize = ltsize.clone();
        this.rbsize = rbsize.clone();

        // 中央エリアを描画するかどうか。
        this.centerPaint = true;
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * paint() をオーバーライド。
     */
    paint(context, dest) {

        // 必要な諸元を取得する。
        var ltpoint = this.ltsize.clone();                                                              // 転送元における、左上領域の右下座標。
        var rbpoint = (new Point(this.image.assumedWidth, this.image.assumedHeight)).sub(this.rbsize);  // 転送元における、右下領域の左上座標。
        var csize = rbpoint.clone().sub(ltpoint);                                                       // 転送元における、中央領域のサイズ。
        var borderlt = dest.lt.clone().sub(this.ltsize);                                                // 転送先における、左上領域の描画位置。

        // 中央エリア
        if(this.centerPaint)
            context.decalImage(this.image, ltpoint.x, ltpoint.y, csize.x, csize.y, dest.left, dest.top, dest.width, dest.height);

        // 四隅。左上から時計回り。
        context.decalImage(this.image, 0, 0, this.ltsize.x, this.ltsize.y, borderlt.x, borderlt.y);
        context.decalImage(this.image, rbpoint.x, 0, this.rbsize.x, this.ltsize.y, dest.right, borderlt.y);
        context.decalImage(this.image, rbpoint.x, rbpoint.y, this.rbsize.x, this.rbsize.y, dest.right, dest.bottom);
        context.decalImage(this.image, 0, rbpoint.y, this.ltsize.x, this.rbsize.y, borderlt.x, dest.bottom);

        // 四辺。左辺から時計回り。
        context.decalImage(this.image, 0, ltpoint.y, this.ltsize.x, csize.y, borderlt.x, dest.top, this.ltsize.x, dest.height);
        context.decalImage(this.image, ltpoint.x, 0, csize.x, this.ltsize.y, dest.left, borderlt.y, dest.width, this.ltsize.y);
        context.decalImage(this.image, rbpoint.x, ltpoint.y, this.rbsize.x, csize.y, dest.right, dest.top, this.rbsize.x, dest.height);
        context.decalImage(this.image, ltpoint.x, rbpoint.y, csize.x, this.rbsize.y, dest.left, dest.bottom, dest.width, this.rbsize.y);
    }
}
