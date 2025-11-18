
/**
 * ステージ上に配置されているオブジェクトを表す実行素子の基底。具体的には派生クラスで、ユニットやトレジャーを表す。
 */
class StandExecutant extends Executant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(stage, seat) {
        super._constructor();

        // 所在ボックスをボックス位置で表す。
        this.seatbox = stage.map.getBox(seat);
        this.position.put(this.seatbox.anchor);

        // ボディの設定。横中央、下端をピボットとし、大きさはレンダラに合わせる。
        var body = new RevisionBody( new Point(0.5, 1.0) );
        this.setBehavior(body);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ステージを表す実行素子。
     */
    get stage() {

        return this.parent;
    }
}
