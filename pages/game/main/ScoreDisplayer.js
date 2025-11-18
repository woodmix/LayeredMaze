
/**
 * 獲得したスコアを一時的に表示するNumberExecutant。
 */
class ScoreDisplayer extends NumberExecutant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   表示する数字。
     */
    _constructor(score) {

        // 基底の初期化。ちょっと小さめに表示する。
        super._constructor("numbers", undefined, 0.5);

        // レイヤーと表示値の修正。
        this.layer = MainScene.UI;
        this.value = score;

        // 字間をちょっと詰める。
        this.space = -20;

        // 残り表示時間。
        this.timer = ScoreDisplayer.LIFE_TIME;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。フレームごとのアップデートフェーズで呼ばれる。
     */
    update(scene) {

        // 時間経過で消えるようにする。
        this.timer -= scene.delta;
        if(this.timer <= 0)  this.dropoff();
    }
}

// 何秒で消えるか。
ScoreDisplayer.LIFE_TIME = 1000;
