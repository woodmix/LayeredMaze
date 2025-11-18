/**
 * レンダラのうち、アニメーションを描画するものを収めたファイル。
 */

//==========================================================================================================
/**
 * アニメーションレンダラの基底クラス。
 */
class AnimationRenderer extends Renderer {

    //------------------------------------------------------------------------------------------------------
    constructor() {
        super();

        // メンバ変数。
        //      this.time       経過時間。一周したらリセットされる。
        //      this.animated   アニメーションするかどうか
        //      this.onround    アニメーションが一周したら呼ばれる宿主のメソッド名かコールバック関数。第一引数はこのレンダラとなる。
        //      this.autoremove trueを指定すると、アニメーションが一周したときにレンダラが削除される。

        // 初期化。
        this.onround = nothing;
        this.animate(true);

        // 最初のbehave()はパスする。
        this.needReset();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * アニメーションのON/OFFを行う。
     *
     * @param   ONにするならtrue、OFFにするならfalseを指定する。
     */
    animate(animated) {

        this.animated = animated;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。needReset() を呼んだ後、最初にbehave()が呼ばれる代わりに呼ばれる。
     */
    reset(scene) {

        // 経過時間をリセット。
        this.time = 0;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 毎フレーム実行される。
     */
    behave(scene) {

        // アニメーションしていないなら何もしない。
        if(!this.animated)
            return;

        // 経過時間の管理。
        this.time += scene.delta;

        // 一周したら...
        if(this.totalDuration <= this.time) {

            // 経過時間をリセット。
            this.time %= this.totalDuration;

            // 自動削除することになっているなら自身を宿主から削除する。
            var host = this.host;
            if(this.autoremove)  this.bye();

            // 一周したときの処理をコールする。
            if(typeof this.onround == "string")  host[this.onround](this);
            else                                 this.onround(this);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 各フレームのdurationの合計を表す。
     */
    get totalDuration() {

        throw new Error("実装して下さい");
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。指定された領域に対して描画する。
     */
    paint(context, dest) {

        // 現在のコマの情報を取得。
        var frame = this.getCurrentFrame();

        // 描画。
        this.sketch(frame, context, dest);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 現在時間におけるコマの情報を返す。
     *
     * @return  コマの情報。キーの構成は派生クラスによるが、imageキーに描画するイメージオブジェクトがセットされている。
     */
    getCurrentFrame() {

        throw new Error("実装して下さい");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定されたコマを指定された領域に対して描画する。
     *
     * @param   コマの情報。getCurrentFrame()の戻り値。
     * @param   描画先となる CanvasRenderingContext2D
     * @param   描画先の領域を表す Rect。
     */
    sketch(frame, context, dest) {

        context.decalImage(frame.image, dest.left, dest.top, dest.width, dest.height);
    }
}


//==========================================================================================================
/**
 * 指定されたコマイメージを、基底の秒数で切り替えていくシンプルなアニメーションレンダラ。
 */
class SimpleAnimator extends AnimationRenderer {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   アニメーションが一周する時間(ms)
     * @param   各コマのイメージを配列で指定する。
     *          各要素はAssetのキー名か、<img> や <canvas>、あるいは ImagePiece インスタンスとする。
     */
    constructor(duration, frames) {
        super();

        // 与えられたフローを正規化する。
        this.duration = duration / frames.length;

        // コマイメージの配列。
        this.frames = frames.map((frame)=>{
            return Asset.needAs(frame, CanvasImageSource);
        });
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。各フレームのdurationの合計を表す。
     */
    get totalDuration() {

        return this.duration * this.frames.length;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。現在時間におけるコマの情報を返す。
     */
    getCurrentFrame() {

        var index = Math.floor(this.time / this.duration) % this.frames.length;

        return {
            image: this.frames[index],
        };
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。描画素材などから考えられる自然な描画範囲の大きさを Point で表す。
     * 最初のコマで描画するイメージの大きさとする。
     */
    get naturalSize() {

        var image = this.frames[0];
        return new Point(image.assumedWidth, image.assumedHeight);
    }
}


//==========================================================================================================
/**
 * 指定されたイメージアトラスに含まれるすべてのピースを使ってシンプルなアニメーションを行う。
 */
class AtlasAnimator extends SimpleAnimator {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   アトラス。Assetのキー名か、ImageAtlas インスタンス。
     * @param   アニメーションが一周する時間(ms)
     */
    constructor(atlas, duration) {

        atlas = Asset.needAs(atlas, ImageAtlas);

        super(duration, atlas.getAllPieces());
    }
}


//==========================================================================================================
/**
 * 指定されたイメージを宿主のボディ領域に描画するレンダラ。
 */
class CustomAnimator extends AnimationRenderer {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   アニメーションの各コマ情報を列挙した配列(フロー)。各コマは以下のキーを持つ。
     *              image       そのコマで表示する画像。Assetのキー名か、<img> や <canvas>、あるいは ImagePiece インスタンス。
     *              duration    表示する時間長(ms)
     *              offset      表示位置をずらす場合はその量をPointで指定する。
     */
    constructor(flow) {
        super();

        // 与えられたフローを正規化する。
        this.flow = this.normalizeFlow(flow);
    }

    /**
     * 外部から与えられたフローを正規化する。
     */
    normalizeFlow(flow) {

        // 各コマを正規化した配列を作成して返す。
        return flow.map((frame) => {

            return {
                image: Asset.needAs(frame.image, CanvasImageSource),
                duration: frame.duration,
                offset: frame.offset ? new Point(frame.offset) : Point.ONE,
            };
        });
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。各フレームのdurationの合計を表す。
     */
    get totalDuration() {

        // 一度の計算で済むようにする。
        if(this._loopInterval == undefined)
            this._loopInterval = this.flow.reduce( (previous, frame) => previous + frame.duration, 0 );

        return this._loopInterval;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 現在時間におけるコマの情報を返す。
     */
    getCurrentFrame() {

        // 現在フローにおける時間位置を取得。
        var time = this.time;

        // コマ設定を一つずつ見て、該当するコマを返す。
        for(var frame of this.flow) {

            if(time < frame.duration)
                return frame;

            time -= frame.duration;
        }

        throw new Error("ここに来るのはおかしい");
    }

    //---------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。指定されたコマを指定された領域に対して描画する。
     */
    sketch(frame, context, dest) {

        // 描画先サイズのイメージサイズに対する倍率を取得。
        var zoom = new Point(dest.width / frame.image.width, dest.height / frame.image.height);

        // 倍率も加味して offset を反映。
        dest.lt.add( frame.offset.clone().multi(zoom) );

        // 描画。
        super.sketch(frame, context, dest);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。描画素材などから考えられる自然な描画範囲の大きさを Point で表す。
     * 最初のコマで描画するイメージの大きさとする。
     */
    get naturalSize() {

        var image = this.flow[0].image;
        return new Point(image.assumedWidth, image.assumedHeight);
    }
}
