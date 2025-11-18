/**
 * 非同期にロードするファイル(リソース)のダウンロードを行うユーティリティ(リソースダウンローダー)を納めるファイル。
 * new して start()、promise でダウンロード完了を検知して、art でリソースを参照するのが基本だか、基本的には Asset を通じてダウンロードと取得を行う。
 */

//==========================================================================================================
/**
 * 基底クラス。
 */
class AssetResource {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   リソースのパス。
     */
    constructor(path) {

        this.path = path;

        // ロード中かどうか。終了した場合のみfalseになる。まだ開始していないてもtrueであることに注意。
        this.loading = true;

        // ダウンロードの完了で解決、失敗で拒否されるプロミス。
        // 解決時ハンドラの引数にはダウンロードされたリソースが、拒否時ハンドラの引数にはリソースに応じたエラーオブジェクトが渡される。
        this.promise = Promise.new();

        // リソースオブジェクト。具体的には Image や Audio などだが、派生クラスによる。
        this.art = null;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードを開始する。
     */
    start() {

        throw new Error("実装して下さい");
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードが完了したときの処理を行う。
     */
    loaded() {

        this.loading = false;

        this.promise.resolve(this.art);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードが失敗したときの処理を行う。
     */
    failed(error) {

        this.loading = false;

        // なるべく読めるエラーメッセージを取得する。
        var description = (error instanceof Event) ? `${error.message} (${error.constructor.name})` : error;

        // コンソールにエラーを出す。
        console.warn(`リソース ${this.path} のロードに失敗しました。\n${description}`);

        // Promiseを拒否状態にする。
        this.promise.reject(error);
    }
}


//==========================================================================================================
/**
 * Image で表されるリソースのダウンローダー。
 */
class ImageResource extends AssetResource {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   リソースのパス。
     * @param   ダウンロード後、assumedWidth, assumedHeight プロパティに倍率を適用するなら、その倍率を数値で指定する。
     */
    constructor(path, scale) {
        super(path);

        this.scale = scale;

        // リソースを作成。
        this.art = new Image();

        // ダウンロード結果を loaded, failed に接続する。
        this.art.onload = this.loaded.bind(this);
        this.art.onerror = this.failed.bind(this);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードを開始する。
     */
    start() {

        this.art.src = this.path;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。ダウンロードが完了したときの処理を行う。
     */
    loaded() {

        // コンストラクタで倍率が指定されているなら適用する。
        if(this.scale) {
            this.art.assumedWidth  *= this.scale;
            this.art.assumedHeight *= this.scale;
        }

        super.loaded();
    }
}


//==========================================================================================================
/**
 * Audio で表されるリソースのダウンローダー。
 */
class MusicResource extends AssetResource {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   リソースのパス。
     */
    constructor(path) {
        super(path);

        // リソースを作成。
        var audio = new Audio(path);
        this.art = audio;

        // ダウンロード結果を loaded, failed に接続する。
        audio.oncanplaythrough = this.loaded.bind(this);
        audio.onerror = this.failed.bind(this);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードを開始する。
     */
    start() {

        this.art.load();
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。ダウンロードが完了したときの処理を行う。
     */
    loaded() {

        // Audioの canplaythrough はなんか知らんが複数回実行されるときがある…
        this.art.oncanplaythrough = undefined;

        super.loaded();
    }
}


//==========================================================================================================
/**
 * AudioBuffer で表されるリソースのダウンローダー。
 */
class SoundResource extends AssetResource {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   リソースのパス。
     */
    constructor(path) {
        super(path);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードを開始する。
     */
    start() {

        // リクエスト。
        var request = new XMLHttpRequest();
        request.open('GET', this.path, true);
        request.responseType = 'arraybuffer';

        // そもそもWebサーバに接続出来ない場合。
        request.onerror = this.failed.bind(this);

        // 完了したけど...
        request.onload = ()=>{

            // Webサーバに接続出来たけどレスポンスがまともじゃない場合。
            if(Math.floor(request.status / 100) != 2) {
                this.failed(`${request.status} ${request.statusText}`);
                return;
            }

            // リクエストが完了したらデコードして AudioBuffer を得る。
            AudioContext.instance.decodeAudioData(request.response).then(

                // 成功した場合。
                (buffer) => {
                    this.art = buffer;
                    this.loaded();
                },

                // 失敗した場合。
                this.failed.bind(this)
            );
        };

        request.send();
    }
}


//==========================================================================================================
/**
 * String で表されるリソースのダウンローダー。
 */
class TextResource extends AssetResource {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   リソースのパス。
     */
    constructor(path) {
        super(path);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * ダウンロードを開始する。
     */
    start() {

        // リクエスト。
        var request = new XMLHttpRequest();
        request.open('GET', this.path, true);
        request.responseType = 'text';

        // そもそもWebサーバに接続出来ない場合。
        request.onerror = this.failed.bind(this);

        // 完了したけど...
        request.onload = ()=>{

            // Webサーバに接続出来たけどレスポンスがまともじゃない場合。
            if(Math.floor(request.status / 100) != 2) {
                this.failed(`${request.status} ${request.statusText}`);
                return;
            }

            // 取得した文字列を String オブジェクトとして得る。
            this.art = new String(request.response);
            this.loaded();
        };

        request.send();
    }
}
