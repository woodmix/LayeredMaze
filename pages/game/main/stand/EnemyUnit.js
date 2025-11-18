
/**
 * 敵ユニットを表す実行素子。
 */
class EnemyUnit extends UnitExecutant {

    // this.enemyindex      敵インデックス。一つのフロア内においては一意になる。撃破済みの敵を記憶するために使われる。

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(stage, seat) {
        super._constructor("enemy", stage, seat);

        this.layer = MainScene.ENEMY;

        // ユニットの所属をセット。
        this.unioncode = "enemy";

        // 最初は非発見状態。
        this.awakened = false;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。次のアクションを決定して実行する。
     */
    performAction(command) {

        // 次のアクションを決定・実行。
        var decision = this.brain.decideAction();
        if(decision)  this.moveTo( this.seatbox.reachout(decision) );

        // 発見状態の管理。
        var marks = this.seatbox.getTravelMarks(EnemyUnit.SENSITIVITY);
        this.awakened = marks.some( box => box.unit && box.unit.unioncode == "player" );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 発見状態かどうかを表す。
     */
    get awakened() {
        return this._awakened
    }
    set awakened(val) {

        // 現在の状態と変わらないなら何もしない。
        if(this._awakened == val)  return;

        // 代入された値の保持。
        this._awakened = val;

        // ON になるなら…
        if(val) {

            // 「！」アイコンを出す。
            var icon = new Executant();
            icon.layer = MainScene.ENEMYICON;
            icon.setBehavior( new ImageRenderer("detection") );
            icon.setBehavior( new RevisionBody(new Point(0,1)) );

            // 表示位置の調整。
            var body = this.behaviors["body"].getRect();
            icon.position.put(body.right - 30, body.top + 30);

        // OFFになるなら「！」アイコンを消す。
        }else {
            var icon = null;
        }

        this.setChild(icon, "awaking");

        // 思考ルーチンを変更。
        var brain = val ? ChaseBrain : RoamBrain;
        this.brain = new brain(this);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。撃破時の処理を行う。
     */
    falldown() {
        super.falldown();

        // スコア獲得処理。
        this.stage.acquireScore(MainScene.TERMINATE, this.seatbox.point);

        // この敵インデックスを撃破済みとしてステージメモリで記憶しておく。
        this.stage.supervisor.memory.terminated.push(this.enemyindex);
    }
}

// プレイヤーユニットが移動距離いくつまでにいると発見状態になるか。
EnemyUnit.SENSITIVITY = 4;
