/**
 * 与えられた値に対して、決められたルールに従って値を返す「補間器」を収めたファイル。
 *
 * 0.0～1.0 の範囲の値を受け取り 0.0～1.0 の範囲の値を返すのが主眼だが、範囲外の値を受けてもそれなりの値を返すし、中には0.0～1.0 を超えた範囲で値を
 * 返すものもいる。それが有用かどうかは呼び出し側による。
 *
 * 補間器を入れ子にすることで様々な数値変化を表現できる。
 *
 *      // 補間器テストコード
 *      var p = new Interpolator();
 *      console.log( "-2.0  => " + p.polate(-2.0)  );
 *      console.log( "-1.0  => " + p.polate(-1.0)  );
 *      console.log( "-0.5  => " + p.polate(-0.5)  );
 *      console.log( " 0    => " + p.polate( 0)    );
 *      console.log( "+0.25 => " + p.polate(+0.25) );
 *      console.log( "+0.5  => " + p.polate(+0.5)  );
 *      console.log( "+0.75 => " + p.polate(+0.75) );
 *      console.log( "+1.0  => " + p.polate(+1.0)  );
 *      console.log( "+2.0  => " + p.polate(+2.0)  );
 *      console.log( "+3.0  => " + p.polate(+3.0)  );
 */

//==========================================================================================================
/**
 * 与えられた値をそのまま返す最も単純な補間器。他のすべての補間器の基底でもある。
 * 任意の範囲の値を受け取り、任意の範囲の値を返す。
 */
class Interpolator {

    polate(x) {
        return x;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 静的メソッド。補間器の指定を正規化する。
     *
     * @param   補間器のインスタンスかクラス名。クラス名を指定する場合は "LinearPolator" なら "linear" とする。
     *          undefined を指定した場合は LinearPolator だが、null の場合は null が返る。
     * @return  正規化した結果の補間器。
     */
    static normalize(polator) {

        if(polator === null)
            return null;

        if(polator === undefined)
            polator = "linear";

        // 文字列で指定されている場合、インスタンスに変換する。
        if(typeof(polator) == "string") {
            var name = polator.ucfirst() + "Polator";
            polator = new (eval(name))();               // class宣言はwindowに格納されないからeval使わざるをえない。
        }

        return polator;
    }
}

// シノニムを作る。
LinearPolator = Interpolator;


//==========================================================================================================
/**
 * 最初は遅く徐々に加速する補間器。コンストラクタ引数は冪指数。高いほど傾向が強くなる。
 */
class EaseoutPolator extends Interpolator {

    constructor(pow = 3) {
        super();
        this.pow = pow;
    }

    polate(x) {
        return Math.pow(x, this.pow);
    }
}


//==========================================================================================================
/**
 * 最初は速く徐々にブレーキをかける補間器。コンストラクタ引数は冪指数。高いほど傾向が強くなる。
 */
class EaseinPolator extends Interpolator {

    constructor(pow = 3) {
        super();
        this.pow = pow;
    }

    polate(x) {
        return Math.pow(x, 1/this.pow);
    }
}


//==========================================================================================================
/**
 * 正弦波を表す補間器。1.0でちょうど一週目を表す。つまり、0.25で1を、0.5で0を、0.75で-1を返す。
 */
class SinPolator extends Interpolator {

    polate(x) {
        return Math.sin(Math.PI * 2 * x);
    }
}


//==========================================================================================================
/**
 * 余弦波を表す補間器。1.0でちょうど一週目を表す。つまり、0.25で0を、0.5で-1を、0.75で0を返す。
 */
class CosPolator extends Interpolator {

    polate(x) {
        return Math.cos(Math.PI * 2 * x);
    }
}


//==========================================================================================================
/**
 * SinPolator と似ている波形だが、曲線ではなくギザギザで描く。
 */
class JagsinPolator extends Interpolator {

    /**
     * @param   チェーン元補完器。本当は基底でやるべきなのだが…暫定措置としてここにある。
     */
    constructor(generator) {
        super();
        this.generator = generator;
        this.pingpong = new PingpongPolator();
    }

    polate(x) {

        // 暫定措置。
        x = this.generator ? this.generator.polate(x) : x;

        // xを2倍してピンポンさせることで ／＼ という形のグラフを得られる。でもこれは 0.0～1.0 の範囲になっているので
        // 0.5下げて2倍することで -1.0～+1.0 にする。
        //                           ／＼
        // あとは1/4周期ずらすことで     ＼／ という形にする。

        var y = this.pingpong.polate((x + 0.25) * 2);
        return (y - 0.5) * 2;
    }
}


//==========================================================================================================
/**
 * ジャンプするような軌道を描く補間器。
 */
class JumpPolator extends Interpolator {

    constructor() {
        super();

        // 他の補間器の組み合わせで実現出来る。
        var polator = new InversePolator(new EaseoutPolator(2));    // これは飛び上がり部分。
        var polator = new PingpongPolator(polator);                 // ピンポンにして 1.0-2.0 の範囲に「落下」を作成。
        var polator = new RunPolator2(polator, 2);                  // それを半分に圧縮して 0.0-1.0 の範囲で描くようにする。
        this.agent = polator;
    }

    polate(x) {
        return this.agent.polate(x);
    }
}
