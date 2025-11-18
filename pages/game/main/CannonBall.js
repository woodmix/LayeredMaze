
/**
 * 大砲の弾を表す実行素子。
 */
class CannonBall extends Executant {

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された地点から指定された方向への大砲弾発射処理を行う。
     *
     * @param   舞台となるStageExecutant
     * @param   発射地点のStageBox
     * @param   発射方向を表す文字列か単位ベクトル。
     */
    static launch(stage, frombox, direction) {

        // 指定された地点から指定された方向への大砲弾を作成、ステージにセットする。
        var ball = this.make(frombox, direction);
        stage.setChild(ball);

        // 大砲の弾が着弾するまで他のアクションが待機するようにする。
        stage.supervisor.queue.push({type:"wait", ant:ball});

        // 着弾地点における爆発コマンドを作成。
        var command = {type:"voila", effect:"explosion", point:ball.destbox.point};

        // 敵に命中しているならその撃破コマンドとスコア獲得コマンドも作成。
        if(ball.destbox.unit) {
            command = {type:"batch", commands:[
                command,
                {type:"falldown", unit:ball.destbox.unit},
            ]};
        }

        // 着弾したら再生されるようにする。
        stage.supervisor.queue.push(command);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された地点から指定された方向へ発射される弾を表すこのクラスのインスタンスを作成する。
     *
     * @param   発射地点のStageBox
     * @param   発射方向を表す文字列か単位ベクトル。
     * @return  このクラスのインスタンス。たた、destbox プロパティに着弾地点の StageBox が格納されている。
     */
    static make(frombox, direction) {

        // 発射方向を単位ベクトルに統一。
        if( !(direction instanceof Point) )
            direction = Point.numpad( Point.dirnum(direction) );

        // 発射地点から発射方向の隣接マスを弾の登場位置として、そのボックスを取得。
        frombox = frombox.reachout(direction);

        // 弾の登場位置と発射方向から弾着ボックスを取得。
        var destbox = this.calcImpact(frombox, direction);

        // 登場ボックスと着弾ボックスの座標でインスタンスを作成。
        var ball = new CannonBall(frombox.center, destbox.center);

        // 着弾ボックスをセットしてリターン。
        ball.destbox = destbox;
        return ball;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された地点から指定された方向へ発射される弾の弾着位置を計算する。
     *
     * @param   StageMapインスタンス
     * @param   発射地点のボックス位置
     * @param   発射方向を表す単位ベクトル
     * @return  弾着ボックスの位置
     */
    static calcImpact(frombox, dir) {

        // 指定された地点が障害物なら、そこが弾着位置になる。
        if(frombox.cragginess == 99)  return frombox;

        // 指定された地点に敵ユニットが居るなら、そこが弾着位置になる。
        var unit = frombox.unit;
        if(unit  &&  unit.unioncode == "enemy")  return frombox;

        // あとは発射方向の隣接マスを取得して再帰して調べる。
        return this.calcImpact(frombox.reachout(dir), dir);
    }


    // インスタンスメソッド
    //======================================================================================================

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   登場座標
     * @param   着弾座標
     */
    _constructor(start, dest) {
        super._constructor();

        // 見た目の設定。
        this.layer = MainScene.EFFECT;
        this.setBehavior( new ImageRenderer("ball") );

        // 登場座標をセット。
        this.position.put(start);

        // 移動器の設定。
        var mover = new DestineMover(dest, 1200);
        this.setBehavior(mover);

        // 到達したら消えるようにする。
        mover.onfinish = "dropoff";
    }
}
