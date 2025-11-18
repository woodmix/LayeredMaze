/**
 * Object, Math 以外の標準オブジェクトに対する拡張を定義するファイル。
 */

// String拡張
//=========================================================================================================

// toLowerCase() と toUpperCase() って、ブラウザーのロケーション設定がトルコだと一般的でない動作をするらしい。
//      http://qiita.com/niusounds/items/fff91f3f236c31ca910f
// …ので、保証する。
if('i' !== 'I'.toLowerCase()) {

    String.prototype.toLowerCase = function() {
        return this.replace(/[A-Z]/g, function(ch){return String.fromCharCode(ch.charCodeAt(0) | 32)});
    };

    String.prototype.toUpperCase = function() {
        return s.replace(/[a-z]/g, function(ch){return String.fromCharCode(ch.charCodeAt(0) & ~32)});
    };
}

/**
 * 引数で指定された長さのランダム文字列を返す。
 *
 * @param   ほしい文字列の長さ。省略した場合は8。
 */
String.random = function(length) {

    // 引数省略時の対応。
    if(length == undefined)
        length = 8;

    // とりあえず8文字生成。
    // ネットでは Math.random().toString(36).substr(-8) というのがよくあるが、1000回試行すると10個以上は
    // 重複する。末尾じゃなくて先頭側を使うとだいぶ軽減される。
    var result = Math.random().toString(36).substr(2, 8);

    // 長さが足りない場合は再帰して対処。余る場合はカットする。
    if(result.length < length)
        result += String.random(length - result.length);
    else if(length < result.length)
        result = result.substr(0, length);

    return result;
}

/**
 * 先頭文字のみを大文字化した文字列を返す。
 */
String.prototype.ucfirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

/**
 * 引数で指定された配列の中にこの文字列と同じ値があるかどうかを返す。
 */
String.prototype.existsIn = function(collection) {

    // toString() しとかないとうまく動作しない。オブジェクトとしてのStringとプリミティブstring型で違いがあるのだろう。
    return collection.includes( this.toString() );
};

/**
 * この文字列をファイルパスと解釈して種々の情報を返す。
 *
 * @return  次のキーを持つコレクション。
 *              dirpath     ディレクトリパス
 *              basename    ベース名
 *              extension   拡張子
 *
 * 例)
 *      var info = "/abc/def/ghi.png.log".pathinfo()
 *      // info = { dirpath: '/abc/def/', basename: 'ghi.png', extension: 'log' }
 *      var info = "http://example.com/abc/def.html?ghi=jkl".pathinfo();
 *      // info = { dirpath: 'http://example.com/abc/', basename: 'def', extension: 'html' }
 */
String.prototype.pathinfo = function() {

    var result = {};

    var match = /^(.*?\/)?([^\/]*?)?(?:\.(\w+))?(?=\?|$)/.exec(this);
    result["dirpath"] = match[1] || "";
    result["basename"] = match[2] || "";
    result["extension"] = match[3] || "";

    return result;
};

/**
 * printf() と同様に文字埋め込みを行う。
 *
 * 例)
 *      var ret = "%05d is %s. %d is %s.".format(100, "hundred", 5, "five");
 *      // ret = "00100 is hundred. 5 is five."
 *
 * …と言っても、対応しているのは %s, %d, %+d, %0Nd, %f, %.Nf, %% のみ。
 */
String.prototype.format = function() {

    // 指定された引数を取っておく。
    var args = arguments;

    // カウンタ変数初期化。
    var count = -1;

    // 置き換え文字列にマッチする正規表現で置き換え処理。
    return this.replace(/%(\+)?\.?(\d+)?([\w%])/g, function(match, p1, p2, p3){

        count++;

        // 対応する引数が undefined, null ならそのように置き換える。
        if(args[count] === undefined  ||  args[count] === null)
            return args[count];

        // 対応する引数が数値であると仮定した場合、符号の表示追加が必要なら準備しておく。
        var sign = p1 ? Math.sign(args[count], "", " ", "+") : "";

        switch(p3) {

            case "s":
                return args[count];

            case "d":

                if(p2 == undefined)
                    return sign + args[count].toFixed();
                else
                    return sign + ("0".repeat(p2) + args[count].toFixed()).slice(-p2);

            case "f":
                if(p2 == undefined)
                    return sign + args[count].toString();
                else
                    return sign + args[count].toFixed(p2);

            case "%":
                return "%";

            default:
                return match;
        }
    })
}


// Array拡張
//=========================================================================================================

/**
 * 全要素の値のうち最大のものを返す。
 *
 * @param   単純に各要素の値を使うのではなく要素に対する何らかの計算結果を使うのであれば、それを求めるための関数を指定する。
 *          この関数は次の引数・戻り値仕様を満たすことが求められる。
 *              @param  要素の値
 *              @param  要素のインデックス
 *              @param  呼び出されている配列
 *              @return 計算結果
 * @return  最大値。空の配列の場合は -Infinity。
 */
Array.prototype.max = function(callback) {

    var vals = callback ? this.map(callback) : this;
    return Math.max(...vals);
}

/**
 * 全要素の値のうち最小のものを返す。
 *
 * @param   単純に各要素の値を使うのではなく要素に対する何らかの計算結果を使うのであれば、それを求めるための関数を指定する。
 *          この関数は次の引数・戻り値仕様を満たすことが求められる。
 *              @param  要素の値
 *              @param  要素のインデックス
 *              @param  呼び出されている配列
 *              @return 計算結果
 * @return  最小値。空の配列の場合は +Infinity。
 */
Array.prototype.min = function(callback) {

    var vals = callback ? this.map(callback) : this;
    return Math.min(...vals);
}

/**
 * 指定されたテスト関数を配列内の各要素に適用して、真値を返した数を数える。
 * テスト関数を省略した場合は、真に評価される値を持つ要素の数を数える。
 *
 * @param   テスト関数。この関数は次の引数・戻り値仕様を満たすことが求められる。
 *              @param  要素の値
 *              @param  要素のインデックス
 *              @param  呼び出されている配列
 *              @return テスト結果
 * @return  テスト関数が真に評価される値を返した数。空の配列の場合は 0。
 */
Array.prototype.count = function(callback) {

    if(callback == undefined)  callback = v => v;

    return this.reduce( (a, v, i, me) => a + (callback(v, i, me) ? 1 : 0), 0 );
}

/**
 * 全要素の値の合計を返す。
 *
 * @param   単純に各要素の値を使うのではなく要素に対する何らかの計算結果を使うのであれば、それを求めるための関数を指定する。
 *          この関数は次の引数・戻り値仕様を満たすことが求められる。
 *              @param  要素の値
 *              @param  要素のインデックス
 *              @param  呼び出されている配列
 *              @return 計算結果
 * @return  合計値。空の配列の場合は 0。
 */
Array.prototype.sum = function(callback) {

    if(callback == undefined)  callback = v => v;

    return this.reduce( (a, v, i, me) => a + callback(v, i, me), 0 );
}

/**
 * 全要素の値の平均を返す。
 *
 * @param   単純に各要素の値を使うのではなく要素に対する何らかの計算結果を使うのであれば、それを求めるための関数を指定する。
 *          この関数は次の引数・戻り値仕様を満たすことが求められる。
 *              @param  要素の値
 *              @param  要素のインデックス
 *              @param  呼び出されている配列
 *              @return 計算結果
 * @return  平均値。空の配列の場合は NaN。
 */
Array.prototype.average = function(callback) {

    return this.sum(callback) / this.length;
}

/**
 * pop() に引数を一つ取れるようにして、引数が指定された場合は指定されたインデックスの要素に対して働くものとする。
 */
Array.prototype.pop_org = Array.prototype.pop;
Array.prototype.pop = function(index) {

    // 引数が指定されていないならオリジナルの pop() を呼ぶ。
    if(index == undefined)
        return this.pop_org();

    // 指定されているなら、その要素を取り出すとともに削除する。
    var ret = this.splice(index, 1);

    // 取り出した値をリターン。
    return ret[0];
}

/**
 * 要素番号をランダムに一つ返す。
 */
Array.prototype.randomIndex = function() {

    // 要素が一つもない場合は undefined を返す。
    if(this.length == 0)
        return undefined;

    return Math.randomInt(0, this.length - 1);
}

/**
 * 要素をランダムに一つ返す。
 */
Array.prototype.random = function() {

    return this[ this.randomIndex() ];
}

/**
 * 要素をランダムに一つ取り出して、その要素を削除する。
 */
Array.prototype.popRandom = function() {

    return this.pop( this.randomIndex() );
}

/**
 * 重複する要素を排除した新しい配列を作成する。
 */
Array.prototype.unique = function() {

    return this.filter( (v, i) => (this.indexOf(v) == i) );
}

/**
 * 要素を数値としてソートする。引数には、降順にソートする場合はtrueを指定する。
 */
Array.prototype.numsort = function(desc) {

    if(desc)  return this.sort( (a, b) => b - a );
    else      return this.sort( (a, b) => a - b );
}

/**
 * Array.prototype.keys() は抜けている要素のインデックスも含めて返すものなので、返さないバージョンの関数を追加する。
 */
Array.prototype.sparseKeys = function() {

    return Object.keys(this);
}

/**
 * 静的メソッド。指定された引数が配列ならそのまま、そうでないなら単一の要素を持つ配列にして返す。
 * ただし、null や undefined を指定すると空の配列を返す。
 */
Array.cast = function(value) {

    switch(true) {
        case value instanceof Array:    return value;
        case value == null:             return [];
        default:                        return [value];
    }
}


// Date拡張
//=========================================================================================================

/**
 * 引数に与えられた日時文字列を Date 型に変換する。Dateコンストラクタと似ているが、アプリで標準的に
 * 扱っている "YYYY-MM-DD hh:mm:ss" 形式の日付を iOS でも確実に解析できるようにする。
 *
 * @param   日時を表す文字列。
 * @return  Date型の値。
 */
Date.generate = function(datetime) {

    if( datetime  &&  datetime.match(/^\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}:\d{2}$/) )
        datetime = datetime.replace(" ", "T") + "+09:00";

    return new Date(datetime);
}

/**
 * 日付を引数で指定されたフォーマットで返す。
 *
 * @param   フォーマット文字列。今のところ、以下の文字列が変換される。
 *              YYYY, YY, MM, DD, hh, mm, ss, S(ミリ秒。1-3桁), W(日本語曜)
 * @return  フォーマット後の文字列。
 */
Date.prototype.format = function(format) {

    if(!format)  format = 'YYYY-MM-DD hh:mm:ss.SSS';

    format = format.replace( /YYYY/g, this.getFullYear() );
    format = format.replace( /YY/g, this.getFullYear().toString().slice(-2) );
    format = format.replace( /MM/g, ('0' + (this.getMonth() + 1)).slice(-2) );
    format = format.replace( /M/g,  this.getMonth() + 1 );
    format = format.replace( /DD/g, ('0' + this.getDate()).slice(-2) );
    format = format.replace( /D/g,  this.getDate() );
    format = format.replace( /hh/g, ('0' + this.getHours()).slice(-2) );
    format = format.replace( /h/g, this.getHours() );
    format = format.replace( /mm/g, ('0' + this.getMinutes()).slice(-2) );
    format = format.replace( /m/g, this.getMinutes() );
    format = format.replace( /ss/g, ('0' + this.getSeconds()).slice(-2) );
    format = format.replace( /s/g, this.getSeconds() );

    if (format.match(/S/g)) {
        var milliSeconds = ('00' + this.getMilliseconds()).slice(-3);
        var length = format.match(/S/g).length;
        for (var i = 0; i < length; i++) format = format.replace( /S/, milliSeconds.substring(i, i + 1) );
    }

    format = format.replace( /W/g, '日月火水木金土'[this.getDay()] );

    return format;
}


// location拡張
//=========================================================================================================

/**
 * ●第一引数のみを指定する場合
 *
 *      引数で指定されたGET変数の値を返す。引数を指定しなかった場合はすべてのGET変数を返す。
 *
 * ●第一, 第二引数を指定する場合
 *
 *      第一引数で指定されたGET変数の値を、第二引数で指定された値に一時的に書き直す。
 */
location.query = function(name, value) {

    // メンバ変数 params にデコード結果を保存する。
    if(!this.params)
        this.params = this.parse();

    if(value == undefined)
        return (name == undefined) ? this.params : this.params[name];
    else
        this.params[name] = value;
}

/**
 * 引数で指定されたクエリ文字列を解析して返す。
 * 引数を指定しなかった場合は location.search を解析する。
 */
location.parse = function(search) {

    if(search == undefined)
        search = this.search.substring(1);

    var params = {};

    var pairs = search.split('&');
    for(var i = 0, entry ; entry = pairs[i] ; i++) {

        var kv = entry.split('=');
        params[ kv[0] ] = decodeURIComponent(kv[1]);
    }

    return params;
}


// Promise拡張
//=========================================================================================================

/**
 * resolve, failure をメソッドとして持つPromiseオブジェクトを作成する。
 * Promiseを提供する機能を作ろうと思ったときに、Promiseコンストラクタの実装は使いづらすぎるので…
 */
Promise.new = function() {

    var resolver, stopper;
    var promise = new Promise( (resolve, failure) => {
        resolver = resolve;
        stopper = failure;
    });
    promise.resolve = resolver;
    promise.reject = stopper;

    return promise;
}


// CanvasRenderingContext2D拡張
//=========================================================================================================

/**
 * explainTextプロパティを定義。テキスト描画関連の現在値を返す。デバッグ用。
 */
CanvasRenderingContext2D.prototype.explainWriting = function() {

    return `font: ${this.font}, textBaseline: ${this.textBaseline}, textAlign: ${this.textAlign}, fillStyle: ${this.fillStyle}, strokeStyle: ${this.strokeStyle}`;
}

/**
 * drawImage() を座標引数六つの形(dw, dh のみを省略)でも呼べるようにする。
 */
CanvasRenderingContext2D.prototype._drawImage = CanvasRenderingContext2D.prototype.drawImage;
CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {

    // dw, dh のみが省略されている場合、sw, sh で補う。
    if(args.length == 6) {
        args[6] = args[2];    args[7] = args[3];
    }

    this._drawImage(image, ...args);
}

/**
 * drawImage() と同じだが...
 *      ・第一引数に ImagePiece も受け入れられるようにする。
 *      ・イメージの設定サイズ(assumedWidth, assumedHeight)と本来サイズ(naturalWidth,naturalHeight)が違う場合、イメージにズームが設定されているものと解釈する。
 */
CanvasRenderingContext2D.prototype.decalImage = function(image, ...args) {

    this.normalizeDraw(image, args);
    this.decalCore(image, ...args);
}

/**
 * decalImage() と同じだが、指定された転送先座標を中心点として描画する。
 */
CanvasRenderingContext2D.prototype.centerImage = function(image, ...args) {

    this.normalizeDraw(image, args);

    args[4] -= args[6] >> 1;
    args[5] -= args[7] >> 1;

    this.decalCore(image, ...args);
}

/**
 * decalImage() 等で指定された座標引数を、すべて指定された形に正規化する。
 *
 * @param   第一引数に指定された値。
 * @param   座標関連の引数(第二引数以降)を配列としてまとめたもの。この配列を操作する形で正規化する。
 */
CanvasRenderingContext2D.prototype.normalizeDraw = function(image, args) {

    // dx, dy のみが指定されている場合は、まずは dw, dh を補って後続に乗せる。
    if(args.length == 2) {
        args[2] = image.assumedWidth;  args[3] = image.assumedHeight;
    }

    // sx, sy, sw, sh が省略されている場合。
    if(args.length == 4) {
        args[4] = args[0];              args[5] = args[1];
        args[6] = args[2];              args[7] = args[3];
        args[0] = 0;                    args[1] = 0;
        args[2] = image.assumedWidth;   args[3] = image.assumedHeight;
    }

    // dw, dh のみが省略されている場合。
    if(args.length == 6) {
        args[6] = args[2];    args[7] = args[3];
    }
}

/**
 * decalImage() 等のコア。
 */
CanvasRenderingContext2D.prototype.decalCore = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {

    // 第一引数が ImagePiece で指定されている場合は生のImageを使った場合のパラメータに展開する。
    if(image instanceof ImagePiece)
        [image, sx, sy, sw, sh, dx, dy, dw, dh] = image.peelClip(sx, sy, sw, sh, dx, dy, dw, dh);

    // イメージの設定サイズと本来サイズの違いを取得し、違いをイメージにズームが設定されているものと解釈する。
    var zoom = new Point(image.naturalWidth / image.assumedWidth, image.naturalHeight / image.assumedHeight);
    sx *= zoom.x;   sy *= zoom.y;
    sw *= zoom.x;   sh *= zoom.y;

    this.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * decalImage() 等で参照されるイメージソースで想定サイズ assumedWidth, assumedHeight を設定出来るようにする。未設定の場合はwidth, height がそのまま使われる。
 */
var assumedSizeProps = {
    assumedWidth: {
        enumerable:true,  configurable:true,
        set: function(val) {
            return this._assumedWidth = val;
        },
        get: function() {
            return this._assumedWidth || this.width;
        },
    },
    assumedHeight: {
        enumerable:true,  configurable:true,
        set: function(val) {
            return this._assumedHeight = val;
        },
        get: function() {
            return this._assumedHeight || this.height;
        },
    },
};
Object.defineProperties(HTMLImageElement.prototype, assumedSizeProps);
Object.defineProperties(HTMLCanvasElement.prototype, assumedSizeProps);
Object.defineProperties(SVGImageElement.prototype, assumedSizeProps);

// ついでに、HTMLCanvasElementでも HTMLImageElement と相互運用出来るように naturalWidth, naturalHeight を参照出来るようにする。
Object.defineProperties(HTMLCanvasElement.prototype, {
    naturalWidth: {
        enumerable:true,  configurable:true,
        get: function() {
            return this.width;
        },
    },
    naturalHeight: {
        enumerable:true,  configurable:true,
        get: function() {
            return this.height;
        },
    },
});


// Audio拡張
//=========================================================================================================

// AudioContext を統一的に使えるようにする。
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// そのインスタンスを作成しておく。
AudioContext.instance = new AudioContext();

/**
 * 引数に指定された範囲をループするようにする。
 *
 * @param   ループ終端の時間。
 * @param   ループ始端の時間。省略時は0秒。
 */
Audio.prototype.setLoop = function(until, since) {

    this.loopUntil = until;
    this.loopSince = since || 0;
    this.addEventListener("timeupdate", Audio.watchLoop, false);
    this.addEventListener("ended", Audio.watchLoop, false);
}

/**
 * setLoop() で設定されたループを解除する。
 */
Audio.prototype.unsetLoop = function() {

    this.removeEventListener("timeupdate", Audio.watchLoop, false);
    this.removeEventListener("ended", Audio.watchLoop, false);
}

/**
 * setLoop() で使われるイベントリスナ。
 */
Audio.watchLoop = function(event) {

    if(this.loopUntil <= this.currentTime)
        this.currentTime = this.loopSince + (this.currentTime - this.loopUntil);

    if(event.type == "ended")
        this.play();
}

/**
 * フェードイン・アウトを行う。
 * フェードインでの目標ボリュームは現在の volume プロパティから参照されるので、先に volume プロパティをセットしておく必要がある。
 *
 * @param   "in":イン か "out":アウト かのいずれかを指定する。
 * @param   フェードにどのくらいの時間をかけるか(ms)。
 *          フェードアウトなら現在のボリュームから 0.0 まで下がる時間。フェードインなら、0.0 から現在のボリュームに戻る時間を指定する。
 */
Audio.prototype.fade = function(direction, fadeLength = 3000) {

    // 1ms あたりのボリューム変化スピードを算出。
    this.fadeSpeed = (direction == "out" ? -1 : +1) * (this.volume / fadeLength);

    // 前回フェード時の時間を初期化。
    this.fadeReference = performance.now();

    // フェードの目標ボリュームを取得。
    this.fadeGoal = (direction == "out") ? 0.0 : this.volume;

    // フェードインはボリューム 0 から始まる。
    if(direction == "in")  this.volume = 0.0;

    // 以降は watchFade() を進行イベントリスナとして順次処理していく。
    this.addEventListener("timeupdate", Audio.watchFade, false);
}

/**
 * fade() で使われるイベントリスナ。
 */
Audio.watchFade = function(event) {

    // 前回呼び出しからの経過時間を取得。
    var now = performance.now();
    var delta = now - this.fadeReference;
    this.fadeReference = now;

    // 今回のボリューム変化量を計算。
    var slide = this.fadeSpeed * delta;

    // 上限／下限をチェックしてから新たなボリュームをセット。
    var method = (slide > 0) ? "min" : "max";
    this.volume = Math[method](this.volume + slide, this.fadeGoal);

    // 目標ボリュームになった場合は...
    if(this.volume == this.fadeGoal) {

        // イベントリスニングを解除。
        this.removeEventListener("timeupdate", Audio.watchFade, false);

        // フェードアウトした場合はストップする。
        if(this.volume == 0.0)  this.pause();
    }
}


// Storage拡張
//=========================================================================================================

/**
 * 現在の値を全て取得する。
 *
 * @param   現在保持している全てのキーと値を含む構造体。
 */
Storage.prototype.getAll = function() {

    var result = {};

    for(var i = 0 ; i < this.length ; i++) {
        var name = this.key(i);
        result[name] = this.getItem(name);
    }

    return result;
}
