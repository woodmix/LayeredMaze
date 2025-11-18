
/**
 * 音を管理するための静的クラス。
 *
 * 例)
 *      // BGMの設定音量を 0.6 にする。
 *      Acousmato.musicVolume = 0.6;
 *
 *      // BGMの演奏を開始する。BGMは同時に一つしか鳴らすことができない。
 *      Acousmato.playMusic("a_bgm");
 *
 *      // BGMのプログラム音量を 0.4 にする。実際の音量は 設定音量×プログラム音量
 *      Acousmato.playingVolume = 0.4;
 *
 *      // SEの設定音量を 0.6 にする。
 *      Acousmato.effectVolume = 0.6;
 *
 *      // "a_sound" を効果音として鳴らす。
 *      Acousmato.strikeEffect("a_sound");
 *
 *      // "a_sound" をプログラム音量を 0.5 で鳴らす。実際の音量は 設定音量×プログラム音量
 *      Acousmato.strikeEffect("a_sound", 0.5);
 *
 *      // ボイスの設定音量を 0.8 にする。
 *      Acousmato.voiceVolume = 0.8;
 *
 *      // "a_voice" をボイスとして鳴らす。
 *      Acousmato.speakVoice("a_voice");
 *
 *      // ミュートをONにする。
 *      Acousmato.mute = true;
 *      // ミュート中はサウンド処理を行わないようになっているので、ミュート中に play() ⇒ ミュート解除としてもBGMは復帰しない。
 *      // これは、ミュートモードなら音ファイル自体のダウンロードをスキップすることを考えているため。アプリ側でミュート解除時に
 *      // 「場面転換などするまで反映されない」旨を説明する必要がある。
 *
 * SEは WebAudio API を、BGMは <audio> を利用している。いずれはBGMも WebAudio API の MediaElementAudioSourceNode を利用するようにしたいが、
 * モバイル端末はまだ対応していないっぽい…鳴るには鳴るのだが、ゲイン調整効いてないし…多分。(2016/12/27)
 */
var Acousmato = {

    // プロパティの初期化。
    _mute: false,
    _musicVolume: 0.7,
    _playingVolume: 1.0,

    // 現在演奏中のBGM。
    currentMusic: undefined,

    // SEを通すAudioNodeを作成。
    effectGain: AudioContext.instance.createGain(),

    // ボイスを通すAudioNodeを作成。
    voiceGain: AudioContext.instance.createGain(),

    //-----------------------------------------------------------------------------------------------------
    /**
     * 初期化を行う。
     */
    initialize() {

        this.effectGain.connect(AudioContext.instance.destination);
        this.voiceGain.connect(AudioContext.instance.destination);
    },

    //-----------------------------------------------------------------------------------------------------
    /**
     * BGMの設定音量とプレイボリュームを表すプロパティ。0.0-1.0。この二つを掛けた値が実際のBGMボリュームになる。
     * BGMの設定音量の初期値は 0.7 になっている。
     */
    get musicVolume() {
        return this._musicVolume;
    },
    set musicVolume(val) {
        this._musicVolume = val;
        this.applyMusicVolume();
    },

    get playingVolume() {
        return this._playingVolume;
    },
    set playingVolume(val) {
        this._playingVolume = val;
        this.applyMusicVolume();
    },

    //---------------------------------------------------------------------------------------------------------
    /**
     * 指定されたBGMを鳴らす。すでに鳴っているBGMはストップする。
     * モバイル端末のブラウザではユーザイベント(onclickとか)の中でないと効かないので注意。それでも別のタイミングで開始したい場合は
     * ユーザイベントの中であらかじめ readyMusic() を呼んでおくと良い。
     *
     * @param   Audioオブジェクトか、それを指す Asset の名前。
     * @param   ループする場合はループ範囲終端の時間位置(秒・小数)。省略時はメディア終端。
     *          ループさせたくない場合は 0 か false を指定する。
     * @param   ループする場合はループ範囲始端の時間位置(秒・小数)。省略時は 0。
     */
    playMusic(music, until, since, volume) {

        // 現在演奏中のBGMがある場合はストップする。
        this.stopMusic();

        // ミュートされている場合は処理しない。
        if(this.mute)
            return;

        // 引数正規化。
        music = Asset.needAs(music, Audio);

        // 現在演奏中のBGMとして保持して、ボリュームを反映する。
        this.currentMusic = music;
        this.applyMusicVolume();

        // 先頭から鳴らす。
        music.currentTime = 0.0;
        music.play();

        // ループ終端が省略されている場合はメディア終端。
        if(until == undefined)
            until = music.duration;

        // ループが指定されているならセットする。
        if(until)
            music.setLoop(until, since);
    },

    /**
     * 現在鳴らしているBGMをストップする。ストップした箇所から再開は出来ないので、その必要がある場合はpauseMusic()を使うべき。
     */
    stopMusic() {

        this.pauseMusic();
        if(this.currentMusic)  this.currentMusic.unsetLoop();
        this.currentMusic = undefined;
    },

    /**
     * 現在鳴らしているBGMを一時停止する。
     */
    pauseMusic() {

        if(this.currentMusic)  this.currentMusic.pause();
    },

    /**
     * pauseMusic() したBGMを再開する。
     */
    continueMusic() {

        if(this.currentMusic)  this.currentMusic.play();
    },

    /**
     * BGMをフェードイン・アウトする。フェードアウトした場合、完了した時点で pause() される。
     *
     * @param   "in":イン か "out":アウト かのいずれかを指定する。
     * @param   フェードにどのくらいの時間をかけるか(ms)。
     *          フェードアウトなら現在のボリュームから 0.0 まで下がる時間。フェードインなら、0.0 から現在のボリュームに戻る時間を指定する。
     */
    fadeMusic(direction, fadeLength = 3000) {

        if(this.currentMusic)  this.currentMusic.fade(direction, fadeLength);
    },

    /**
     * ユーザイベント中でないと演奏開始出来ないモバイル端末などでこのメソッドをユーザイベント中で呼んでおくと、
     * 後のイベント外のタイミングで演奏開始出来るようになる。
     *
     * @param   準備しておきたいAudioオブジェクトか、それを指す Asset の名前。
     */
    readyMusic(music) {

        // 引数正規化。
        music = Asset.needAs(music, Audio);

        // なんかしらんがこうしておくだけで鳴らせるようになる。アセットロードの時にもう呼んでるんだけどね。ネットワークモニタ見ててもすでにロードされてるし。
        // まあ、ユーザイベント中に改めて呼ぶことに意味があるのだろう。
        music.load();
    },

    //-----------------------------------------------------------------------------------------------------
    /**
     * SEの設定音量を表すプロパティ。0.0-1.0。strikeEffect() 呼び出し時のボリュームと掛け合わせた値が実際のボリュームになる。
     */
    get effectVolume() {
        return this.effectGain.gain.value;
    },
    set effectVolume(val) {
        this.effectGain.gain.value = val;
    },

    //---------------------------------------------------------------------------------------------------------
    /**
     * 指定されたサウンドを効果音として鳴らす。40ms(60fpsにおける2.5フレーム)以内に同じ音を鳴らそうとしても無視するので留意。
     *
     * @param   AudioBufferオブジェクトか、それを指す Asset の名前
     * @param   プログラム音量。0.0-1.0。
     * @return  再生のために作成した AudioBufferSourceNode。このオブジェクトのstop()を呼び出すことで途中で止めることが出来る。
     *          無視して鳴らさなかった場合は null。
     */
    strikeEffect(buffer, volume = 1.0) {

        return this.chimeSound(this.effectGain, buffer, volume);
    },

    //-----------------------------------------------------------------------------------------------------
    /**
     * ボイスの設定音量を表すプロパティ。0.0-1.0。speakVoice() 呼び出し時のボリュームと掛け合わせた値が実際のボリュームになる。
     */
    get voiceVolume() {
        return this.voiceGain.gain.value;
    },
    set voiceVolume(val) {
        this.voiceGain.gain.value = val;
    },

    //---------------------------------------------------------------------------------------------------------
    /**
     * 指定されたサウンドをボイスとして鳴らす。40ms(60fpsにおける2.5フレーム)以内に同じ音を鳴らそうとしても無視するので留意。
     *
     * @param   AudioBufferオブジェクトか、それを指す Asset の名前
     * @param   プログラム音量。0.0-1.0。
     * @return  再生のために作成した AudioBufferSourceNode。このオブジェクトのstop()を呼び出すことで途中で止めることが出来る。
     *          無視して鳴らさなかった場合は null。
     */
    speakVoice(buffer, volume = 1.0) {

        return this.chimeSound(this.voiceGain, buffer, volume);
    },

    //-----------------------------------------------------------------------------------------------------
    /**
     * ミュート状態を表すプロパティ。ミュートにするなら true、解除するなら false。
     */
    get mute() {
        return this._mute;
    },
    set mute(val) {

        this._mute = val;

        if(this.currentMusic)
            val ? this.pauseMusic() : this.continueMusic();
    },


    // private
    //=====================================================================================================

    //---------------------------------------------------------------------------------------------------------
    /**
     * 指定されたオーディオバッファを指定されたノードに接続して再生する。
     * 40ms(60fpsにおける2.5フレーム)以内に同じ音を鳴らそうとしても無視するので留意。
     *
     * @param   出力先のAudioNode
     * @param   AudioBufferオブジェクトか、それを指す Asset の名前
     * @param   プログラム音量。0.0-1.0。
     * @return  再生のために作成した AudioBufferSourceNode。このオブジェクトのstop()を呼び出すことで途中で止めることが出来る。
     *          無視して鳴らさなかった場合は null。
     */
    chimeSound(outputNode, buffer, volume = 1.0) {

        // ミュートされている場合は処理しない。
        if(this.mute)
            return null;

        // 引数正規化。
        buffer = Asset.needAs(buffer, AudioBuffer);

        // 前回鳴らした時刻から規定の時間が経過していないなら無視する。
        var now = performance.now();
        if(now < buffer._acousmato_previousTime + 40)  return null;
        buffer._acousmato_previousTime = now;

        // AudioBufferSourceNode を作成。
        var source = AudioContext.instance.createBufferSource();
        source.buffer = buffer;

        // ボリュームの反映。
        var gain;
        if(volume == 1.0) {
            gain = outputNode;
        }else {
            var gain = AudioContext.instance.createGain();
            gain.gain.value = volume;
            gain.connect(outputNode);
        }

        // 指定されたノードに接続して再生開始。
        source.connect(gain);
        source.start(0);
        return source;

        // それにしても、ここで作成した AudioBufferSourceNode やら GainNode やらって disconnect() せんでいいんだろうか…
        // まあリファレンスでは全く言及されてないし、メモリプロファイルでも問題ない(?)っぽいから良いのかな…
    },

    //---------------------------------------------------------------------------------------------------------
    /**
     * BGMボリュームの変更を反映する。
     */
    applyMusicVolume() {

        if(this.currentMusic)
            this.currentMusic.volume = this._musicVolume * this._playingVolume;
    },
}

// 初期化を行っておく。
Acousmato.initialize();
