
/**
 * マップ上のボックスに付けられるマーカーを管理・表示するための実行素子。
 */
class StageMarker extends Executant {

    //------------------------------------------------------------------------------------------------------
    _constructor() {
        super._constructor();

        // マーカーのために割り当てられたレイヤー順をセット。
        this.layer = MainScene.MARKER;

        // マーカーを表示する StageBox の配列。
        this.spots = [];

        // マーカーを表示するときに参照するアニメーション周期タイマー。
        this.tweentime = 0;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された複数のボックスをマーカーを表示するものとして保持する。
     *
     * @param   マーカーを表示したい StageBox の配列。
     */
    setMarkers(boxes) {

        // 指定されたボックスを保持。
        this.spots.push(...boxes);

        // アニメーション周期タイマーをリセット。
        this.tweentime = 0;
    }

    /**
     * マーカーをすべてクリアする。
     */
    clearMarkers() {

        this.spots.length = 0;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * フレームごとのアップデートフェーズで呼ばれる。
     */
    update(scene) {

        // アニメーション周期タイマーを管理。
        this.tweentime += scene.delta;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。ドローフェーズにおいて自分を描画する処理を行う。
     */
    draw(context, scene) {

        // ショートカット。
        if(this.spots.length == 0)  return;

        // アニメーション周期タイマーを参照して不透明度を決める。
        var alpha = 1.0 - ((this.tweentime % StageMarker.DURATION) / StageMarker.DURATION);

        // 不透明度適用。
        var prev = context.globalAlpha;
        context.globalAlpha *= alpha;

        // マーカー色設定。
        context.fillStyle = "gold";

        // マーカー描画。
        for(var box of this.spots)
            context.fillRect(box.position.x, box.position.y, StageBox.TIPSIZE, StageBox.TIPSIZE);

        // 不透明度を戻す。
        context.globalAlpha = prev;
    }
}

// アニメーション一周の時間(ms)
StageMarker.DURATION = 1500;
