
/**
 * プレイヤーユニットを表す実行素子。
 */
class PlayerUnit extends UnitExecutant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(stage, seat) {
        super._constructor("player", stage, seat);

        this.layer = MainScene.PLAYER;

        // ユニットの所属をセット。
        this.unioncode = "player";

        // 現在処理中アクションを命令したStageCommand。入力受付中かどうかのフラグも兼ねる。
        this.prompt = false;

        // 次のアクション命令で実行する内容。
        this.decision = null;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ステージ上のマスがタップされたときに呼ばれる。
     *
     * @param   タップされたボックスを表すStageBox。
     */
    boxTapped(box) {

        // 入力待機中でないなら何もしない。
        if( !this.prompt )  return;

        // 現在位置しているマスやその隣以外は無視する。
        if(box.point.manhattan(this.seatbox.point) > 1)  return;

        // アレスタが作動中かも知れないので、一応検査する。
        if(this.behaviors["mover"])  return;

        // そのマスが侵入不可なら...
        if(box.cragginess == 99) {

            // アレスタを使って表現する。チップサイズの1/3だけ移動して戻ってくる動き。
            var diff = box.point.clone().sub(this.seatbox.point);
            this.arrester.walker.dest.put( diff.multi(StageBox.TIPSIZE/3) );
            this.setBehavior(this.arrester, "mover");
            return;
        }

        // 移動範囲マーカーを消去。
        this.stage.markers.clearMarkers();

        // コマンドの発効時間を改めて設定して、入力待機中のフラグを解除して、並列実行を解禁する。
        this.prompt.issuedTime = this.getScene().time;
        this.prompt.waiting = false;
        this.prompt = null;

        // 現在の所在ボックスを選択した場合はノーアクションを表現、違うボックスを選択したならそこへ移動する。
        if(box == this.seatbox)  this.setBehavior(this.noaction, "mover");
        else                     this.moveTo(box);

        // スコアを微減する。
        this.stage.parent.scorer.slide(-MainScene.WALK);

        // 移動時SE。
        Acousmato.strikeEffect("chick-cry1");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。次のアクションを決定して実行する。
     */
    performAction(command) {

        // 移動可能なボックスにマーカーを表示。
        this.stage.markers.setMarkers( this.seatbox.getTravelMarks(1, this) );

        // 入力待ち状態になる。コマンドに入力待機中のフラグを立てて、並列実行を抑制する。
        this.prompt = command;
        command.waiting = true;
    }

    /**
     * オーバーライド。アクション実行中かどうかを返す。
     */
    inAction() {

        // 入力待ち、あるいは行動中かどうかで判断する。buds まで見ているのは、入力待機フラグの解除から移動器のアタッチまで１フレーム必要で、
        // budsを見ないとその瞬間の判定が「アクション終了」になってしまうため。
        return this.prompt  ||  super.inAction()  ||  this.buds.length > 0;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 他ユニットと同じマスに位置することになったら呼ばれる。
     */
    jostled(bumper) {

        // 同じ種類のユニットと当たったのは無視する。…まあ今回はプレイヤーキャラ一体しかいないからチェックは必要ないけど。
        if(this.unioncode == bumper.unioncode)  return;

        // 次のコマンドを同時に実行する。
        this.stage.supervisor.queue.push({type:"batch", commands:[
            {type:"falldown", unit:this},   // 自身の転倒
            {type:"miss"},                  // ゲームオーバー
        ]});
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。アップデートフェーズの処理を行う。
     */
    processUpdate(scene) {

        // 処理前の位置座標を取っておく。
        var old = this.position.clone();

        // 基底の処理。
        super.processUpdate(scene);

        // 処理による移動量を取得。ステージを反対に動かしてカメラ上の位置が動かないようにする。
        var move = this.position.clone().sub(old);
        if(this.stage)  this.stage.position.add( move.clone().multi(-1) );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。撃破時の処理を行う。
     */
    falldown() {
        super.falldown();

        // BGMストップ。
        Acousmato.stopMusic();

        // プレイヤー撃破時のSE。
        Acousmato.strikeEffect("boyoyon1");
    }
}
