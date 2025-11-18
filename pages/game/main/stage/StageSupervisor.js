
/**
 * ステージ内の要素に対するコマンドの管理を行うビヘイバー(スーパーバイザー)。StageExecutantのビヘイバーとしてアタッチされる。
 */
class StageSupervisor extends Behavior {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   フロアデータを参照するときのセクション接尾辞。
     */
    constructor(trailer) {
        super();

        this.floorId = trailer;

        // 発効待ちのコマンドのキュー。
        this.queue = new CommandQueue(this);

        // 現在処理中のコマンド
        this.runningCommands = [];

        // マップ定義ファイルから指定されたフロアのギミックを取得しておく。
        var sections = Asset.take("map");
        this.floordata = JSON.parse( sections["data" + trailer] );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。実行素子にアタッチ・デタッチされたときに呼ばれる。
     *
     * @param   宿主となる実行素子。デタッチされた場合はnull。
     */
    attached(host) {
        super.attached(host);

        // アタッチされたときのみ処理する。
        if(host == null)  return;

        // 恒久メモリを初期化。
        if(!host.parent.stagememory[this.floorId])
            host.parent.stagememory[this.floorId] = {extinguished:[], terminated:[]};

        // メンバ変数に保持する。
        this.memory = host.parent.stagememory[this.floorId];

        // ギミックを初期化する。
        this.gimmicks = {};
        for(var [name, gim] of this.floordata.gimmicks) {
            var gimmick = this.initializeGimmick(gim, name);
            if(gimmick)  this.gimmicks[name] = gimmick;
        }

        // 最初のコマンドはタイトルシーンからメインシーンへの切り替え待ち。
        this.queue.push({type:"wait", scene:host.getScene()});
    }

    /**
     * 引数に指定されたギミック定義を初期化する。
     */
    initializeGimmick(gim, name) {

        // ショートハンドによるテンプレートを戻り値として取得。
        var result = this.makeTemplate(gim, name);

        // 明示されているキーを上書きコピー。
        result.deepmerge(gim);

        // 名前を格納する。
        result.name = name;

        // oneshot フラグがONになっている場合は...
        if(result.oneshot) {

            // すでに起動済みの場合は使用しない。
            if( this.memory.extinguished.includes(name) )
                return null;

            // ギミックのコマンドが発効するときに、ギミックが消えるようにする。
            result.command = {type:"batch", commands:[
                {type:"remove", target:name},
                result.command
            ]};
        }

        return result;
    }

    /**
     * ギミック定義のショートハンドを検査して、それに応じたギミック構造体を作成する。
     */
    makeTemplate(gim, name) {

        switch(gim.shorthand) {
            case "scorepoint":
                return {
                    "trigger": {"into":gim.pos.clone(), "unit":"player"},
                    "ornament": "fruit",
                    "oneshot": true,
                    "command": {"type":"score", "value":MainScene.FRUIT, "point":gim.pos.clone()}
                };
            case "cannon":
                return {
                    "trigger": {"into":gim.pos.clone(), "unit":"player"},
                    "ornament": "cannon-" + gim.dir,
                    "command": {"type":"kick", "target":name, "method":"act"}
                };
            case "downstairs":
                return {
                    "trigger": {"into":gim.pos.clone(), "unit":"player"},
                    "ornament": "stair-downward",
                    "command": {"type":"stair", "updown":"down", "port":name}
                }
            case "upstairs":
                return {
                    "trigger": {"into":gim.pos.clone(), "unit":"player"},
                    "ornament": "stair-upward",
                    "command": {"type":"stair", "updown":"up", "port":name}
                }
            default:
                return {};
        }
    }


    // イベントの処理
    //======================================================================================================

    //------------------------------------------------------------------------------------------------------
    /**
     * ステージ上をユニットが移動した場合に呼ばれる。呼ばれるタイミングは移動を開始するときであって、完了したときではない。
     *
     * @param   イベントを起こした要素。PlayerUnitオブジェクト。
     */
    notifyMove(reporter) {

        // ギミックの起動チェック。
        this.checkGimmicks(reporter);

        // 他ユニットとの当たり判定。
        this.checkJostling(reporter);

        // この二つによって発生する優先コマンドは、「他ユニットとの当たり判定」によるもののほうが優先度が高い。
        // 優先コマンドのキューは先入れ後出しであるため、「他ユニットとの当たり判定」の方を後に行う必要がある。
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * あるユニットが移動したときの他ユニットとの当たり判定を行う。
     *
     * @param   移動したユニット。
     */
    checkJostling(mover) {

        // 存在するユニットを一つずつ見ていく。
        for(var unit of this.host.units) {

            // 自身はスキップ。
            if(unit == mover)  continue;

            // 同じ座標に位置していたら、双方に通知。
            if(mover.seatbox == unit.seatbox) {
                mover.jostled(unit);
                unit.jostled(mover);
            }
        }
    }


    // ギミックの管理
    //======================================================================================================

    //------------------------------------------------------------------------------------------------------
    /**
     * あるユニットが移動したときのギミックの起動チェックを行う。
     *
     * @param   移動したユニット。
     */
    checkGimmicks(stamper) {

        // ギミックを一つずつ見ていく。
        for(var [key, gimmick] of this.gimmicks) {

            // トリガー条件がないものは無視。
            var trigger = gimmick.trigger;
            if( !trigger )
                continue;

            // トリガー条件に "unit" が指定されている場合、イベント起動者がその指定と一致しているかチェック。
            if(trigger.unit  &&  trigger.unit != stamper.unioncode)
                continue;

            // トリガー条件に "into" がないものは無視。
            if( !trigger.into )
                continue;

            // イベント起動者の移動先のマスが "into" で指定されているマスと一致するならギミックを起動。
            if( stamper.seatbox.point.equals(trigger.into) )
                this.igniteGimmick(key);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定されたキーのギミックを起動する。
     *
     * @param   ギミックのキー。
     */
    igniteGimmick(key) {

        this.fireGimmick(this.gimmicks[key]);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 引数に指定されたギミックを起動する。
     */
    fireGimmick(gimmick) {

        // oneshotフラグを持つギミックの場合は、起動済みとしてステージメモリで記憶しておく。
        if(gimmick.oneshot)
            this.memory.extinguished.push(gimmick.name);

        // ギミックが格納しているコマンドをコマンドキューへ格納する。
        this.queue.push(gimmick.command);
    }


    // コマンドキューの処理
    //======================================================================================================

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとのアップデートフェーズで呼ばれる。
     */
    behave(scene) {

        // 現在実行中コマンドの状況を見て、終了しているようならプロパティ runningCommands から削除する。
        this.runningCommands = this.runningCommands.filter( command => command.isRunning(this.host) );

        // 現在実行中のコマンドがある場合に...
        if(this.runningCommands.length > 0) {

            // 次に実行するコマンドが現在実行中コマンドと一つでも並列不可なら、コマンドが終了するまで待つ必要がある。
            var next = this.queue.peek();
            var parallelizable = this.runningCommands.every( command => next.canParallelize(command, scene.time) );
            if(!parallelizable)  return
        }

        // 以降、次のコマンドの実行。現在実行中コマンドがない、あるいは、現在コマンドと次コマンドが並列可能な場合が該当する。

        // キューの先頭に格納されているコマンドを取得してキューから削除する。
        // コマンドの実行によってキューの状態が変化するため、必ず実行の前に削除を行っておく必要がある。
        var command = this.queue.shift();

        // そのコマンドを実行。
        if(command) {

            command.issue(this.host, scene.time);

            // 現在処理中のコマンドとして保持する。
            this.runningCommands.push(command);
        }
    }
}
