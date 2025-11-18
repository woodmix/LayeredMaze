/**
 * エフェクトを表す実行素子を収める。
 */

//==========================================================================================================
/**
 * 大砲の発射煙を表示するミスト。
 */
class FiresmokeMist extends Mistant {

    //------------------------------------------------------------------------------------------------------
    /**
     */
    _constructor() {
        super._constructor();

        this.layer = MainScene.EFFECT;

        // 表示時間と半径を決定。
        const duration = 1000, radius = 50;

        // パーティクルの雛型を登録。
        var brush = new FadeBall("dimgray", 60);
        this.generator = new BrushParticle(duration, new LineWalker({polator:new EaseinPolator(4)}), brush);

        // 煙玉をセット。45度から90度間隔で4つ。
        for(var angle = Math.PI45 ; angle < Math.PI360 ; angle += Math.PI90) {
            var particle = this.spawn();
            particle.walker.dest = Point.circle(angle).multi(radius).int();
            this.add(particle);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。フレーム毎に呼ばれる。
     */
    update(scene) {
        super.update(scene);

        // すべてのパーティクルが消えたら自身も消える。
        if(this.particles.length == 0)  this.dropoff();
    }
}


//==========================================================================================================
/**
 * 爆発。
 */
class ExplosionExecutant extends Executant {

    //------------------------------------------------------------------------------------------------------
    _constructor() {
        super._constructor();

        this.layer = MainScene.EFFECT;

        var ani = new AtlasAnimator("explosion", 400);
        ani.autoremove = true;
        ani.onround = "dropoff";
        this.setBehavior(ani);
    }
}


//==========================================================================================================
/**
 * ユニットが撃破されるときに使用するミスト。
 */
class FalldownMist extends NanaMistant {

    //------------------------------------------------------------------------------------------------------
    _constructor() {
        super._constructor();

        this.layer = MainScene.EFFECT;

        // パーティクルの雛型を登録。
        this.generator = new BrushParticle(0, new LineWalker({polator:"easein"}), new MeltBall("", 40));

        // パーティクル発生量をセット。
        this.clock = Clocker.perMille(100);

        // 一定時間で止まるようにする。
        this.clock.stopper = 200;

        // パーティクルパラメータの設定。
        this.duration = 200;
        this.color = ["lightgreen", "firebrick", "lightblue"];
        this.emission = {
            angle: new ApproxFloat(Math.PI180, Math.PI360),
            distance: new Approx(300, 500),
        };
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。フレーム毎に呼ばれる。
     */
    update(scene) {
        super.update(scene);

        // パーティクルの生成が終わって、すべてのパーティクルが消えたら自身も消える。
        if(!this.clock.active  &&  this.particles.length == 0)
            this.dropoff();
    }
}
