/**
 * ステージコマンドのうち、その他特殊なものを納める。
 * コマンド内の各キーについては art/map.txt のコマンドに関する説明を参照。
 */

//==========================================================================================================
/**
 * type:score のコマンドを取り扱うクラス。
 */
class ScoreCommand extends StageCommand {

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドを実行する。
     */
    run(stage) {

        // スコア獲得処理。
        stage.acquireScore(this.value, this.point);

        // スコアギミック起動音。
        Acousmato.strikeEffect("decision22");
    }
}


//==========================================================================================================
/**
 * type:remove のコマンドを取り扱うクラス。
 */
class RemoveCommand extends StageCommand {

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドを実行する。
     */
    run(stage) {

        delete this.supervisor.gimmicks[this.target];

        stage.setChild(null, `ornament-${this.target}`);
    }
}


//==========================================================================================================
/**
 * type:kick のコマンドを取り扱うクラス。
 */
class KickCommand extends StageCommand {

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドを実行する。
     */
    run(stage) {

        // targetプロパティで指定された置物を取得して...
        var ornament = stage.childs[`ornament-${this.target}`];

        // 指定されたメソッドを呼び出す。
        ornament[this.method]();
    }
}


//==========================================================================================================
/**
 * type:voila のコマンドを取り扱うクラス。
 */
class VoilaCommand extends StageCommand {

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドを実行する。
     */
    run(stage) {

        // effect キーで指定されたエフェクトを作成。
        switch(this.effect) {

            // 爆発。
            case "explosion":

                // 今のところ画面振動もセットになっている。
                stage.vibrate();

                // 爆発を表現する素子を作成。
                var ant = new ExplosionExecutant();

                // 爆発SE。
                Acousmato.strikeEffect("bomb1");
                break;
        }

        // 位置をセットしてステージに追加。
        ant.position.put( stage.map.getBox(this.point).center );
        stage.setChild(ant);
    }
}


//==========================================================================================================
/**
 * type:wait のコマンドを取り扱うクラス。
 */
class WaitCommand extends StageCommand {

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドが現在実行中かどうかを返す。
     */
    isRunning(stage) {

        switch(true) {
            case !!this.ant:        return !!this.ant.parent;
            case !!this.scene:      return !this.scene.playing;
        }
    }
}


//==========================================================================================================
/**
 * type:batch のコマンドを取り扱うクラス。
 */
class BatchCommand extends StageCommand {

    //------------------------------------------------------------------------------------------------------
    /**
     * コンストラクタで追加の処理を行う。
     */
    constructor(supervisor, props) {
        super(supervisor, props);

        this.commands = this.commands.map( command => StageCommand.createCommand(supervisor, command) );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドを実行する。
     */
    run(stage) {

        for(var command of this.commands)
            command.issue(stage, this.issuedTime);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。コマンドが現在実行中かどうかを返す。
     */
    isRunning(stage) {

        return this.commands.some( command => command.isRunning(stage) );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。このコマンドが指定されたコマンドと並列実行出来るかどうかを返す。
     */
    canParallelize(command, now) {

        // まずは自身がチェック。
        if( !super.canParallelize(command, now) )  return false;

        // さらにエントリされているコマンドがすべて並列可能と報告するなら、並列実行出来る。
        return this.commands.every( entry => entry.canParallelize(command, now) );
    }
}
