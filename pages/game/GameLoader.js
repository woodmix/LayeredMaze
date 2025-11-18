
/**
 * ローディング画面。
 */
class GameLoader extends LoaderScene {

    //-----------------------------------------------------------------------------------------------------
    _constructor(canvas) {
        super._constructor(canvas);

        // 黒背景とする。
        this.layer = 0;
        this.setBehavior( new FillRenderer("black") );

        // 「Loading...」の文字と残りカウント数を描画する。
        this.setChild(new LoaderText(), "text");
        this.setChild(new LoadingRemain(), "remain");

        if(Settings["debug"]) {
            this.setChild(new DebugGrid(), "debug-grid");
            this.setChild(new DebugInfo(), "debug-info");
        }
    }

    //-----------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。アセットのロードを行う。
     */
    load() {

        Asset.loadAll(
            "art/map.txt",
            "art/graph/title.svg",
            "art/graph/tips.x3.4&4.jam.png",
            "art/graph/player.1&4.png",
            "art/graph/enemy.1&4.png",
            "art/graph/cannon.1&4.png",
            "art/graph/explosion.4&2.png",
            "art/graph/ball.png",
            "art/graph/detection.png",
            "art/graph/fruit.png",
            "art/graph/numbers.png",
            "art/graph/clear.svg",
            "art/music/WhIte.mp3",
            "art/sound/roll-finish1.wav",
            "art/sound/tympani-roll1.wav",
            "art/sound/chick-cry1.wav",
            "art/sound/decision22.wav",
            "art/sound/cannon2.wav",
            "art/sound/bomb1.wav",
            "art/sound/walk-staircase-home-descend1.wav",
            "art/sound/walk-gravel1.wav",
            "art/sound/boyoyon1.wav",
            "art/sound/game-versus2.wav",
            "art/sound/fireworks2.wav",
        );

        // マップデータについては ParagraphsResource に変換する。
        var res = new ParagraphsResource( Asset.resources.get("map") );
        Asset.replaceResource(res, "map");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。ロードが完了したときの処理を行う。
     */
    loadout(canvas) {

        console.log("asset loaded");

        return new TitleScene(canvas);
//         return new MainScene(canvas);
//         return new ClearScene(canvas, 500);
    }
}


//==========================================================================================================
/**
 * 「Loading...」の文字を描画する実行素子。
 */
class LoaderText extends Executant {

    //------------------------------------------------------------------------------------------------------
    _constructor() {
        super._constructor();

        this.layer = 1;

        // 画面右下を起点とする。
        this.setBehavior( new PositionAnchor(null, new Point(1,1), new Point(-350,-100)) );

        // 左揃えのテキスト。
        var renderer = new TextRenderer();
        renderer.style = "white";
        renderer.halign = "left";
        renderer.valign = "bottom";
        this.setBehavior(renderer);
    }

    //------------------------------------------------------------------------------------------------------
    update(scene) {

        // 末尾の「...」を、2.5秒周期の4段階で変化させる。
        var length = Math.floor( (scene.time % 2500) / 2500 * 4 );
        this.text = "Loading" + ".".repeat(length);
    }
}
