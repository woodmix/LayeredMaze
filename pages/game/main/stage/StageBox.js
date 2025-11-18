
/**
 * マップ上の一つのマス(ボックス)を表すクラス。普通、StageMapインスタンスの getBox() を通じて取得する。
 */
class StageBox {

    //------------------------------------------------------------------------------------------------------
    /**
     * コンストラクタ。
     *
     * @param   このボックスを持つマップ。
     * @param   ボックスのX位置
     * @param   ボックスのY位置
     * @param   グラウンドチップ識別子を下レイヤーから順に列挙した配列
     */
    constructor(map, x, y, grounds) {

        this.map = map;

        // ボックスの位置。
        this.point = new Point(x, y);

        // グラウンドのチップインデックス(チップ識別子から、そのチップのマスタ収録位置をPointで表したもの)をレイヤー順に列挙した配列。
        this.grounds = grounds.map( ground => StageBox.getTipIndex(ground) );

        // マーカーを表示するかどうか。
        this.marker = false;
    }

    /**
     * チップ識別子からチップインデックスを取得する。例えば "5A" を渡すと Point(5, 10) を返す。
     *
     * @param   チップ識別子
     * @return  チップインデックスを表すPoint。"--" の場合はnull。
     */
    static getTipIndex(tip) {

        if(tip == "--")
            return null;
        else
            return new Point(parseInt(tip.charAt(0), 16), parseInt(tip.charAt(1), 16));
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 移動コストを表す。今回は 1 か 99 しかない。
     */
    get cragginess() {

        // まだ取得していないなら取得する。
        if(this._cragginess == undefined) {

            // グラウンドの各レイヤーが持つ移動コストのうち最大のもの。
            this._cragginess = this.grounds.max( v => v ? parseInt(StageMap.cragmap[v.y][v.x]) : 0 );
        }

        return this._cragginess;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ボックスの左上座標を表す。
     */
    get position() {

        return this.point.clone().multi(StageBox.TIPSIZE);
    }

    /**
     * ボックスの中央座標を表す。
     */
    get center() {

        return this.position.clone().add(StageBox.TIPSIZE/2);
    }

    /**
     * ボックスの横中央、下端の座標を表す。ユニットのpositionなどがここに合わせられる。
     */
    get anchor() {

        return this.position.clone().add(StageBox.TIPSIZE/2, StageBox.TIPSIZE);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * このボックスに所在するユニットを表す。所在するユニットがいない場合は undefined。
     */
    get unit() {

        // 戻り値をキャッシュする。まだキャッシュしていない、キャッシュしていたユニットが既に移動している、既に撃破されている場合は再取得する。
        if(!this._unit  ||  this._unit.seatbox != this  ||  !this._unit.parent)
            this._unit = this.map.host.units.find( unit => unit.seatbox == this );

        return this._unit;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * このボックスを基準に、引数に指定された距離だけ移動した先にあるボックスを取得する。
     *
     * @param   移動方向と距離を表すPoint。
     * @return  その先にあるStageBox。
     */
    reachout(vector) {

        return this.map.getBox( this.point.clone().add(vector) );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * StageMap.prototype.getNeighbors()の第一引数をこのボックスに固定したショートハンド。詳細はそちらを参照。
     */
    getNeighbors(dist = 1) {

        return this.map.getNeighbors(this.point, dist);
    }

    /**
     * StageMap.prototype.getTravelMarks()の第一引数をこのボックスに固定したショートハンド。詳細はそちらを参照。
     */
    getTravelMarks(legs, unit = null) {

        return this.map.getTravelMarks(this.point, legs, unit);
    }

    /**
     * StageMap.prototype.getStarRoute()の第一引数をこのボックスに固定したショートハンド。詳細はそちらを参照。
     */
    getStarRoute(goal) {

        return this.map.getStarRoute(this.point, (goal instanceof StageBox) ? goal.point : goal);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * このボックスを描画する。
     *
     * @param   Context2Dオブジェクト
     */
    draw(context) {

        // レイヤー順に描画していく。
        for(var ground of this.grounds)
            StageBox.drawTip(context, ground, this.position);
    }

    /**
     * 引数で指定されたチップを指定された箇所に描画する。
     *
     * @param   Context2Dオブジェクト
     * @param   描画するチップのインデックス
     * @param   描画する位置
     */
    static drawTip(context, tip, pos) {

        // "--" のチップは描画しない。
        if(!tip)  return;

        // チップインデックスを元に描画。
        context.decalImage(Asset.take("tips").image,
            tip.x * StageBox.TIPSIZE, tip.y * StageBox.TIPSIZE, StageBox.TIPSIZE, StageBox.TIPSIZE, pos.x, pos.y
        );
    }
}

// マップチップのサイズ。
StageBox.TIPSIZE = 96;
