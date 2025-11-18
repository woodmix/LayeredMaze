
/**
 * クリアシーンの花火を表すミスト。
 */
class FireworkMist extends Mistant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   花火の星の色
     * @param   花火の半径
     */
    _constructor(color, radius = 500) {
        super._constructor();

        this.layer = ClearScene.EFFECT;

        // パーティクルの雛型を登録。
        this.generator = new BrushParticle(1000, new LineWalker({polator:"easein"}), new MeltBall(color, 40));

        // 360度均等に撃ち出される星を12個セット。
        for(var angle = 0 ; angle <= Math.PI360 ; angle += Math.PI360 / 12) {
            var particle = this.spawn();
            particle.walker.dest = Point.circle(angle).multi(radius).int();
            this.add(particle);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。フレーム毎に呼ばれる。
     */
    activate(scene) {

        // SE。
        Acousmato.strikeEffect("fireworks2");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。フレーム毎に呼ばれる。
     */
    update(scene) {
        super.update(scene);

        // 一定速度で下がっていくようにする。
        this.position.y += FireworkMist.FALL_SPEED * scene.delta;

        // すべてのパーティクルが消えたら自身も消える。
        if(this.particles.length == 0)  this.dropoff();
    }
}

// 落下スピード
FireworkMist.FALL_SPEED = 300 / 1000;
