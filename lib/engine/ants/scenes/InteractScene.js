
/**
 * ユーザイベント、環境イベントも処理するシーン。TimeSceneから派生する。
 * このシーンや子実行素子は、自身の "interactor" ビヘイバを通じてUIについてのイベントを処理できるようになる。
 *
 * イベントはまだタップとドラッグしか取れない。他のイベントが必要になったときのメモ…
 *      ロングタップ    発生する瞬間はタッチエンドではなくタッチ中なので、いろいろ工夫が必要になるだろう。
 *      スワイプ        ドラッグの移動量積算が閾値を超えたら…というものだが、基盤の実装でその閾値は決められない。
 *                      結局ドラッグと変わらなくなる。Executantの派生で別途定義するなどしたほうが良いだろう。
 *      フリック        「途中までドラッグしてそこからフリック」とかの可能性もあるので、「厳密には閾値を超える速さの
 *                      ドラッグが発生して、かつ、それからタッチエンドまでの時間が一定値以下」となる。
 * まあ必要になったらそのときに実装かな…
 *
 * 対象のcanvasにイベントリスナを登録するので、シーン処理が終わったときにオブジェクトを破棄したいなら dispose() する必要がある(canvasごと破棄するなら必要ない)。
 */
class InteractScene extends TimeScene {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   描画対象となる <canvas> 要素かそのid値。
     */
    _constructor(canvas) {

        // タッチ開始された時間と座標。
        this.touchTime = 0;
        this.begin = null;

        // ドラッグと判定したかどうか。
        this.dragged = false;

        // ドラッグ処理中、直前検出時のマウス位置。
        this.follow = null;

        // 現在実行中のタップイベントとドラッグイベントを受け取る実行素子のコレクション。
        // タップ系のイベントを受け取る素子を tap キー、ドラッグイベントを受け取る素子を drag キーに保持する。
        this.sensors = null;

        // マウスイベントのリスナのthisをバインドしたものを作成。
        this.startListener = this.touchstart.bind(this)
        this.endListener = this.touchend.bind(this)
        this.moveListener = this.touchmove.bind(this)

        super._constructor(canvas);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * canvas プロパティへの代入をオーバーライド。
     */
    set canvas(value) {

        // 古いキャンバスからカップリングを解除する。
        if(this._canvas)
            this.decoupleCanvas();

        // 基底の処理。
        super.canvas = value;

        // 新しいキャンバスへカップリング処理。
        if(this._canvas)
            this.coupleCanvas();
    }

    // セッターをオーバーライドしたらゲッターもオーバーライドしないといけないらしい。
    get canvas() {
        return super.canvas;
    }

    /**
     * 対象キャンバスのイベント処理を開始する。
     */
    coupleCanvas() {

        // addEventListener() は同じ関数を複数回登録しても無視するので、このメソッドが複数回呼ばれても問題ないようになっていることに留意。

        // スマホだとマウスイベントは300msの遅延があるので、ちゃんとタッチ系を取らなければならない。
        // それは良いとして、どちらかのみを取得していると、今度はタッチ付きPCディスプレイでのタッチがマウスイベントを発火しないという問題に当たる。
        // 遅延がなくなればマウス系のイベントだけを処理していれば良い(Androidは <meta name="viewport"> があると遅延がなくなるらしい)のだが…
        // それまでは結局両方リッスンする必要がある。
        // このままだとスマホでは一度のタッチで二回イベント処理することになるが、preventDefault() するので重複分は発行されない。

        this.canvas.addEventListener("touchstart", this.startListener);
        this.canvas.addEventListener("mousedown", this.startListener);

        this.canvas.addEventListener("touchend", this.endListener);
        this.canvas.addEventListener("mouseup", this.endListener);

        this.canvas.addEventListener("touchmove", this.moveListener);
        this.canvas.addEventListener("mousemove", this.moveListener);
    }

    /**
     * 対象キャンバスのイベント処理を停止する。canvasを保持したままこのオブジェクトだけ破棄したい場合は呼んでおく必要がある。
     */
    decoupleCanvas() {

        this.canvas.removeEventListener("touchstart", this.startListener);
        this.canvas.removeEventListener("mousedown", this.startListener);

        this.canvas.removeEventListener("touchend", this.endListener);
        this.canvas.removeEventListener("mouseup", this.endListener);

        this.canvas.removeEventListener("touchmove", this.moveListener);
        this.canvas.removeEventListener("mousemove", this.moveListener);
    }


    // タッチイベント関連
    //======================================================================================================

    //------------------------------------------------------------------------------------------------------
    /**
     * タッチ開始・ボタン押下時にコールされる。
     */
    touchstart(event) {

        // 動作中のみ処理する。
        if(!this.playing)  return;

        // event.offsetX,Y を確実に使えるようにする。
        if(event["offsetX"] == undefined) {
            var finger = event.touches[0];
            event.offsetX = finger.clientX - finger.target.offsetLeft;
            event.offsetY = finger.clientY - finger.target.offsetTop;
        }

        // イベント関連情報初期化。
        this.touchTime = performance.now();
        this.begin = new Point(event.offsetX, event.offsetY);
        this.dragged = false;
        this.follow = this.begin.clone();

        // タッチされた座標におけるインタラクション素子を取得する。
        this.sensors = InteractScene.searchSensor( this, this.begin.clone().multi(this.canvasRatio) );

        // 反応する実行素子があるならブラウザのタッチ挙動をキャンセルする。
        // これをやらないとブラウザがタッチを処理して(スクロールとか領域のライトアップとか)、touchmoveも発生しなくなる。
        if(this.sensors.tap  ||  this.sensors.drag)
            event.preventDefault();

        // 反応する実行素子がない場合は preventDefault() せずにスクロール等をできるようにする。
        // スマホではタッチ系とマウス系で二回実行されるが、どの実行素子も反応しないから問題ない。

        // タップ系反応素子がいるならイベントを送信する。
        this.fireEvent(this.sensors.tap, "touch", this.begin);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * タッチ終了・ボタン解放時にコールされる。
     */
    touchend(event) {

        // 動作中のみ処理する。
        if(!this.playing)  return;

        // ドラッグ判定されておらず、タッチ開始から終了までの時間が規定以内ならタップイベントを発行する。
        if(!this.dragged  &&  performance.now() - this.touchTime < 750)
            this.fireEvent(this.sensors.tap, "tap", this.begin);

        // 後続のtouchmove(mousemove)が処理されないようにする。
        this.touchTime = 0;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * タッチ移動・マウス移動時にコールされる。マウス移動ではボタン押下していなくても呼ばれるので注意。
     */
    touchmove(event) {

        // 動作中のみ処理する。
        if(!this.playing)  return;

        // 押下中のもののみを処理する。
        if(this.touchTime == 0)
            return;

        // event.offsetX,Y を確実に使えるようにする。
        if(event["offsetX"] == undefined) {
            var finger = event.touches[0];
            event.offsetX = finger.clientX - finger.target.offsetLeft;
            event.offsetY = finger.clientY - finger.target.offsetTop;
        }

        // まだドラッグ判定されておらず…
        if(!this.dragged) {

            // 移動量が規定範囲から出ていない場合は処理しない。
            if( this.follow.manhattan(new Point(event.offsetX, event.offsetY)) < 10 )
                return;
        }

        // ここまで来たらドラッグ処理。
        this.dragged = true;

        // 前回検出からの移動量を取得。
        var move = new Point(event.offsetX - this.follow.x, event.offsetY - this.follow.y);
        this.follow.put(event.offsetX, event.offsetY);

        // ドラッグイベントを発行。
        this.fireEvent(this.sensors.drag, "drag", move);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * staticメソッド。
     * 引数で指定された実行素子とその子供に対して、指定された座標でタップ系・ドラッグ系のイベントに誰が答えるのかを調べさせる。
     *
     * @param   調査させたい実行素子。
     * @param   タッチスタートした座標。
     * @param   内部で使用する。
     * @return  次のキーを持つオブジェクト。
     *              tap         タップ系のイベントに答える実行素子。いない場合は null。
     *              drag        ドラッグ系のイベントに答える実行素子。いない場合は null。
     */
    static searchSensor(ant, point, result) {

        // 最初の呼び出しなら戻り値を初期化する。
        if(!result)
            result = {"tap":null, "drag":null};

        // 判定座標にpositionとscaleを反映して…
        point = ant.getCoord(point);

        // まずは指定された実行素子に対して、インタラクションビヘイバを持っているなら調べる。
        var interactor = ant.behaviors["interactor"];
        if(interactor) {

            // その座標でどの系統のイベントに反応するのか答えさせる。
            var senses = interactor.sense(point);

            // 反応する各系統において、現在保持している素子よりも手前にあるなら戻り値として保持する。
            for(let sense of senses) {
                if(!result[sense]  ||  (result[sense].layer || -1) < ant.layer)
                    result[sense] = ant;
            }
        }

        // 次にその子供に対して調査していく。
        for( let child of ant.childs.values() )
            InteractScene.searchSensor(child, point, result);

        return result;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された実行素子に、指定されたイベントを送信する。
     *
     * @param   送信先の実行素子
     * @param   イベント種別
     * @param   イベント発生地点。dragの場合はドラッグ距離となる。
     */
    fireEvent(sensor, type, point) {

        // 指定された素子にインタラクションビヘイバーがない場合は処理しない。
        if(!sensor  ||  !sensor.behaviors["interactor"])
            return;

        // 発生地点or距離を送信先素子の座標系に合わせる。まずはキャンバス内における座標系に合わせる。
        point = point.clone().multi(this.canvasRatio);

        // そこから送信先の実行素子まで各階層の座標系を適用していくのだが、ドラッグ距離である場合は親の階層まで、かつ原点が反映されないように注意しないといけない。
        if(type == "drag")
            point = sensor.parent ? sensor.parent.localCoord(new Rect(0, 0, point)).size : point;
        else
            point = sensor.localCoord(point);

        // イベント情報を送信。
        sensor.behaviors["interactor"].interact({type:type, point:point});
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * CSS上での1ピクセルに対する、このキャンバスのピクセル数を返す。
     *
     * @return  X, Y 軸におけるピクセル数を表すPoint。
     */
    get canvasRatio() {

        var canvas = this.canvas;
        return new Point(canvas.width / canvas.clientWidth, canvas.height / canvas.clientHeight);
    }
}
