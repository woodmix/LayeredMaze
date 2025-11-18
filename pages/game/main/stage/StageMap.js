
/**
 * ステージのマップの管理を行うビヘイバー(マップマネージャー)。レンダラとしても機能する。StageExecutantのビヘイバーとしてアタッチされる。
 */
class StageMap extends Renderer {

    //------------------------------------------------------------------------------------------------------
    /**
     * @param   フロアデータを参照するときのセクション接尾辞。
     */
    constructor(trailer) {
        super();

        // マップデータを取得。
        var sections = Asset.take("map");

        // まだマップデータから [cragmap] を取得していないなら取得する。
        if( !StageMap.cragmap )
            StageMap.cragmap = this.parseTableChunk( sections["cragmap"] );

        // 指定されたフロアのグラウンドデータと置物データを取得。
        var ground0 = this.parseTableChunk( sections["lowerground" + trailer] );
        var ground1 = this.parseTableChunk( sections["upperground" + trailer] );

        // boxes プロパティを作成。第一次元にY、第二次元にXを取って各ボックスを格納する二次元配列。
        this.boxes = new Array(ground0.length);
        for(var y = 0 ; y < this.boxes.length ; y++) {

            this.boxes[y] = new Array(ground0[y].length);

            for(var x = 0 ; x < this.boxes[y].length ; x++)
                this.boxes[y][x] = new StageBox(this, x, y, [ground0[y][x], ground1[y][x]]);
        }
    }

    /**
     * 引数に指定されたテーブル状のデータ記述を解析して二次元配列状の結果を返す。
     */
    parseTableChunk(data) {

        // まずは改行で分割。
        var result = data.split("\n");

        // 各行をセルごとに分割。
        result = result.map( line => line.match(/\S{2}/g) || [] );

        // カラ行を削除して出来上がり。
        return result.filter( line => line.length > 0 );
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * マップの縦横ボックス数をPointで表す。
     */
    get largeness() {

        return new Point(this.boxes[0].length, this.boxes.length);
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 引数で指定された矩形が含まれるボックスの範囲を返す。
     *
     * @param   矩形。Rectインスタンス。
     * @return  矩形が含まれるボックスの範囲。Rectインスタンス。
     */
    getArea(rect) {

        var result = rect.grid(StageBox.TIPSIZE);

        return result.intersect(new Rect(0, 0, this.largeness));
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された位置のボックスを返す。
     *
     * @param   データが欲しいボックスの位置。Point に変換可能な値で指定する。
     * @return  StageBox インスタンス。マップ範囲外のボックスを指定された場合は undefined。
     */
    getBox(...point) {

        point = new Point(...point);

        return this.boxes[ point.y ] && this.boxes[ point.y ][ point.x ];
    }


    //
    //======================================================================================================

    //-----------------------------------------------------------------------------------------------------
    /**
     * 指定されたボックス位置の隣のボックスを配列で返す。「すぐ隣でなく、2マス隣」などの指定も可能。
     *
     * @param   基準の位置
     * @param   基準からいくつ離れたボックスが必要か。
     * @return  指定された位置から指定の距離をもつボックスの配列。マップの範囲を超えるボックスは返されない。
     *
     * 例1) 次の位置を基準にコールすると...
     *         □□□□□□□
     *         □□□■□□□
     *         □□□□□□□
     *         □□□□□□□
     *      次の位置の配列が返る。
     *         □□□■□□□
     *         □□■□■□□
     *         □□□■□□□
     *         □□□□□□□
     * 例2) 距離2でコールすると、次の位置の配列が返る。
     *         □□■□■□□
     *         □■□□□■□
     *         □□■□■□□
     *         □□□■□□□
     */
    getNeighbors(point, dist = 1) {

        // 戻り値初期化。
        var result = [];

        // X座標で左から追加していく。
        //                          □□□□□□□                □□■□□□□
        // 上の例2で説明すると、まず□■□□□□□を追加して、次に□■□□□□□を追加していく感じ。
        //                          □□□□□□□                □□■□□□□
        //                          □□□□□□□                □□□□□□□
        for(var xdist = -1 * dist ; xdist <= dist ; xdist++) {

            // Y軸における、基準点からの距離を取得。
            var ydist = dist - Math.abs(xdist);

            // まず下側を追加。
            var box = this.getBox(point.x + xdist, point.y + ydist);
            if(box)  result.push(box);

            // 次に上側を追加。
            if(ydist != 0) {
                var box = this.getBox(point.x + xdist, point.y - ydist);
                if(box)  result.push(box);
            }
        }

        return result;
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 指定された位置から移動可能なボックスを列挙する。
     *
     * @param   移動元のボックス位置
     * @param   移動力
     * @param   移動するユニット。地形コストやZOCを無視する場合はNULLを指定する。
     * @return  移動可能なボックスを列挙した配列。移動元のボックスも含まれる。
     */
    getTravelMarks(start, legs, unit = null) {

        // マークされたボックス位置のYを第一次元、Xを第二次元に取って移動力残余を格納する二次元配列。
        var marks = [];

        // ZOC 判定の必要がある場合はユニット所在マップを取得しておく。
        // var unitMap = unit ? $this->getUnitMap() : null;
        var unitMap = null;

        // 移動元の位置をマークして、あとは再帰的に処理する。
        this.spreadMarks(marks, start, legs, unit, unitMap);

        // マークされた位置のボックスをすべて取得して戻り値とする。
        var result = [];
        for(var y of marks.sparseKeys()) {
            for(var x of marks[y].sparseKeys())
                result.push( this.getBox(x, y) );
        }

        return result;
    }

    /**
     * getTravelMarks() のヘルパ。
     * 指定された位置をマークして、さらに隣接ボックスに踏み込めるなら再帰してマークしていく。
     */
    spreadMarks(marks, point, legs, unit, unitMap) {

        // 指定されたボックス位置をマーク。移動力残余を格納する。
        if( !marks[point.y] )  marks[point.y] = []
        marks[point.y][point.x] = legs;

        // これ以上移動できないなら隣接ボックスを調べる必要はない。
        if(legs <= 0)  return;

        // 隣接ボックスを列挙。
        var neighbors = this.getNeighbors(point);

        // 隣接ボックスを一つずつ処理する。
        for(var neighbor of neighbors) {

            // 踏み込めないならマークできない。
            if(legs < neighbor.cragginess)  continue;

            // すでにマークしたことがある場合、より大きな移動力残余で踏み込めないなら新たにマークしない。
            if(marks[neighbor.y]  &&  marks[neighbor.y][neighbor.x]  &&  legs - neighbor.cragginess <= marks[neighbor.y][neighbor.x])
                continue;

            // // ZOCの判定の必要がある場合。
            // if(unit) {
            //
            //     // 踏み込もうとしている場所にユニットがいないかチェック。いる場合に、そのユニットの所属が移動者と違う場合は踏み込めない。
            //     $findUnit = $this->findUnitOn(neighbor, unitMap);
            //     if($findUnit  &&  unit->getUnion() != $findUnit->getUnion())
            //         continue;
            // }

            // ここまでくればマーク可能。
            this.spreadMarks(marks, neighbor.point, legs - neighbor.cragginess, unit, unitMap);
        }
    }

    //------------------------------------------------------------------------------------------------------
    /**
     * 引数で指定されたボックス間の移動パスを返す。到達不能であっても、最も近い点までの移動経路が返される。
     * ゴールボックス自体が侵入不可でも、その隣までが侵入可能ならゴールまでの移動経路が返されるので注意(これは、
     * 敵ユニットを目標地点とするときに役に立つ)。
     *
     * @param   移動元のボックス位置
     * @param   移動先のボックス位置
     * @return  移動経路を表す文字列。1マスの移動について数字一文字の文字列で表現されている。文字は 1:上, 3:左, 5:右, 7:下 のいずれか。
     *              例) 55511137    右右右上上上左下
     *          到達不能な場合でも、マンハッタン距離が最も小さくなる座標までの経路が格納される。
     */
    getStarRoute(start, goal) {

        // 実装は「A*」。用語等はインターネットを参照。

        // 移動元と先が同じという特殊ケースを処理する。
        if( start.equals(goal) )  return "";

        // オープンしたマスの情報を格納する配列を初期化。
        var scans = [];

        // 経路探索。最も肉薄したマスを変数 cursor で保持する。
        var cursor = this.buildStarMap(scans, start, goal);

        // そのマスから親マスをたどって、変数 route に経路を逆順で作成していく。
        var route = "";
        for( ; cursor.prev ; cursor = cursor.prev)
            route += cursor.pos.clone().sub(cursor.prev.pos).padnum().toString();

        // 逆順で作成したルートをひっくり返して正順にする。
        return route.split("").reverse().join("");
    }

    /**
     * A*の考え方に従って、ゴールに辿り着くまで必要なマスをオープンする。
     *
     * @param   オープンしたマスの情報を、Yを第一次元、Xを第二次元に取って格納する二次元配列。
     * @param   出発点
     * @param   目標点
     * @return  第一引数にセットしたマスのうち、最も肉薄したマスの情報。ゴールに到達できたならゴールのマスとなる。
     */
    buildStarMap(scans, start, goal) {

        // 現在オープンしているマスのリストを初期化。
        var opens = [];

        // 移動元を無条件にオープンする。ここのヒューリスティック距離は参照されないので何でも良い。
        var starbox = {
            pos:start, prev:null, cost:0, heur:0,
        };
        scans[start.y] = [];  scans[start.y][start.x] = starbox;
        opens.push(starbox);

        // ゴールにたどり着くまでループ。
        while(true) {

            // オープンマスがなくなってしまったら到達はできない。最も肉薄したマスをリターン。
            if(opens.length == 0)
                return this.nearestStarBox(scans);

            // オープンリストの中から最もスコアが低くて、後に追加されたものを取得。
            // そのマスはクローズする(オープンリストから削除する)。
            var focus = this.nearestStarBox(opens, true);

            // 隣接するマスを取得。
            var neighbors = this.getNeighbors(focus.pos);

            // 最短経路が複数ある場合に、なるべくユニットごとに選択経路が異なるようにする。
            // if($unit->getNo() % 2)
            //     $neighbors = array_reverse($neighbors);

            // 隣接マスを一つずつ処理する。
            for(var neighbor of neighbors) {

                // オープン。ゴールにたどり着いたらリターン。
                if( this.openStarBox(scans, opens, focus, neighbor, goal) )
                    return scans[goal.y][goal.x];
            }
        }
    }

    /**
     * 指定されたマスがオープンできるかどうか調べて、できるならオープンする。
     * ゴール地点は無条件でオープンされることに注意。戻り値はそこがゴールだったかどうか。
     */
    openStarBox(scans, opens, focus, target, goal) {

        var pos = target.point;

        // すでにオープンしたことがある場合、それよりも低いコストで踏み込めないなら再オープンしない。
        var opened = scans[pos.y] && scans[pos.y][pos.x];
        if(opened  &&  opened.cost <= focus.cost + target.cragginess)  return false;

        // オープンするかどうか判断する。ただし、到達点である場合は無条件でオープンするのでスキップ。
        if( !pos.equals(goal) ) {

            // 踏み込めないマスならオープンしない。
            if(target.cragginess == 99)  return false;

            // // 踏み込もうとしている場所にユニットがいないかチェック。
            // $findUnit = $this->findUnitOn(pos, $unitMap);
            //
            // // いる場合に、そのユニットの所属が移動者と違う場合は踏み込めない(ZOC)。
            // if($findUnit  &&  $unit->getUnion() != $findUnit->getUnion())
            //     return false;
        }

        // ここまで来たらオープンする。ヒューリスティック距離を求めるときに残距離を重く見積もっているのは最初に選択した経路にある程度拘らせるため。
        // そのほうが早い場合が多いんじゃないかなーと思ってるんだけど…
        var starbox = {
            pos: pos, prev: focus,  cost: focus.cost + target.cragginess,
            heur: focus.cost + target.cragginess + goal.manhattan(pos)*2,
        };

        if(!scans[pos.y])  scans[pos.y] = [];
        scans[pos.y][pos.x] = starbox;
        opens.push(starbox);

        // 踏み込んだマスはゴールかどうかを返す。
        return pos.equals(goal);
    }

    /**
     * 引数で指定された序数／連装配列の中からゴールまでのスコアが最も低くて、後に追加されたものを探して、
     * そのインデックスを返す。
     */
    nearestStarBox(boxes, pop = false) {

        var cursor, result;

        for(var index of boxes.sparseKeys()) {

            var frog = (boxes[index] instanceof Array) ? this.nearestStarBox(boxes[index]) : boxes[index];

            if(result == undefined  ||  frog.heur <= result.heur) {
                cursor = index;
                result = frog;
            }
        }

        if(pop)  delete boxes[cursor];

        return result;
    }


    // レンダリング
    //======================================================================================================

    //------------------------------------------------------------------------------------------------------
    /**
     * オーバーライド。描画先の領域を取得する。
     */
    getDest(scene) {

        // 基底では宿主のボディ領域を使うようになっているが、カメラに映っている領域とする。
        return this.host.takeBody(scene);
    }

    /**
     * オーバーライド。指定された領域に対して描画する。
     */
    paint(context, dest) {

        // カメラに映っているボックス範囲をRectで取得。
        var area = this.getArea(dest);

        // ボックスを一つずつ描画していく。
        for(var y = area.top ; y < area.bottom ; y++) {
            for(var x = area.left ; x < area.right ; x++)
                this.boxes[y][x].draw(context);
        }
    }
}
