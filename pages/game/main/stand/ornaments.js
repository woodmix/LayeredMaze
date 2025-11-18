/**
 * ステージ上の可視ギミックを表す実行素子を収める。
 */

//==========================================================================================================
/**
 * 基底クラス。
 */
class OrnamentExecutant extends StandExecutant {

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定されたシンボル種別に対応するクラス関数を返す。
     *
     * @param   シンボル種別。art/map.txt で説明している。
     * @return  ギミック表示素子のクラス。
     */
    static getOrnamentClass(type) {

        // 例えば "xxxx-yyyy" という種別名なら "XxxxOrnament" というクラスがあるか調べて、あるならそれ、ないなら MiscOrnament を返す。
        var classname = type.split("-")[0].ucfirst() + "Ornament";

        try {
            return eval(classname);
        }
        catch(e) {
            return MiscOrnament;
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(stage, seat) {
        super._constructor(stage, seat);

        this.layer = MainScene.GMMICK;
    }
}


//==========================================================================================================
/**
 * その他の可視ギミック。基本的に表示されるだけのものなどはこれで実現していく。
 */
class MiscOrnament extends OrnamentExecutant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   シンボル種別。art/map.txt で説明している。
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(type, stage, seat) {
        super._constructor(stage, seat);

        // シンボル種別に応じたレンダラをセットする。
        switch(type) {

            // スコアフルーツの場合は...
            case "fruit":

                // 回転が出来るイメージレンダラをセットしておいて...
                var renderer = new RotateRenderer(new ImageRenderer("fruit"), 0.5);
                this.setBehavior(renderer);

                // ツイーンで少し回転させる。
                var tween =  new TweenBehavior("behaviors.renderer.angle", Math.PI15, 4000, "sin");
                this.setBehavior(tween);
                break;

            case "stair-downward":
                var image = Asset.take("tips").piece(0, 1);
                break;

            case "stair-upward":
                var image = Asset.take("tips").piece(0, 1);
                break;

            case "exitport":
                var image = Asset.take("tips").piece(1, 1);
                break;
        }

        if(image)  this.setBehavior( new ImageRenderer(image) );
    }
}


//==========================================================================================================
/**
 * 大砲。
 */
class CannonOrnament extends OrnamentExecutant {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   シンボル種別。art/map.txt で説明している。
     * @param   このオブジェクトが配置されるステージ実行素子。
     * @param   所在ボックス位置。Point に変換可能な値で指定する。
     */
    _constructor(type, stage, seat) {
        super._constructor(stage, seat);

        // シンボル種別に含まれる向きの引数を取得。
        var dir = Point.dirnum( type.split("-")[1] );

        // その向きを表す単位ベクトルを取得。
        this.direction = Point.numpad(dir);

        // 向きに応じた表示イメージを取得してレンダラを設定する。
        var piece = Asset.take("cannon").piece(0, Math.floor(dir/2));
        this.setBehavior( new ImageRenderer(piece) );

        // スケールを調整出来るようにする。
        this.setBehavior( new RevisionBody([0.5, 1.0]) );

        // ツイーンでスケールを変化させる。将来的にはmanhattanへの代入一つで出来るのだが…
        var tween =  new TweenBehavior("behaviors.body.scale.x", 0.05, 4000, "jagsin");
        this.setBehavior(tween, "tween_width");
        var tween =  new TweenBehavior("behaviors.body.scale.y", 0.05, 4000, "jagsin");
        this.setBehavior(tween, "tween_height");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 大砲メカニクスの作動処理を行う。
     */
    act() {

        // 自身の発射アニメーションを再生。
        this.fire();

        // 大砲の弾を撃ち出す。
        CannonBall.launch(this.stage, this.seatbox, this.direction);

        // 撃ち出しSE。
        Acousmato.strikeEffect("cannon2");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 発射アニメーションを再生する。
     */
    fire() {

        // 発射煙を作成。セット位置は向きに合わせて調整する。例えば右向きならボックスの右端中央となる。
        var smoke = new FiresmokeMist();
        smoke.position.add(0, -StageBox.TIPSIZE/2);
        smoke.position.add( this.direction.clone().multi(StageBox.TIPSIZE/2) );
        this.setChild(smoke);

        // 反動を表現する移動器をセット。線形的に行って戻ってくる動き。
        var apex = this.direction.clone().multi(-1).multi(StageBox.TIPSIZE/3);
        this.setBehavior( new PikoMover(apex, 200) );
    }
}
