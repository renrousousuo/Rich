/**
 * 大富翁游戏
 * @param io socket_io 实例
 */

function Rich(io) {
    this._conf = {
        'max_rooms': 1, // 最大房间数目
        'max_players': 2, //最大玩家数
        'max_players_per_room': 2, // 每个房间的最大玩家数
    };
    this._sockets = {}; // socket 实例 map
    this._rooms = {}; // 房间数据 map
    this._players = {
        'total': 0, //当前玩家数量
        'items': {
        },
    }; //玩家数据
    this._defaultRoomId = null; //默认房间 id
    this._channel = null; // socket channel
    this._sidToRoomMap = {}; // socket 到 房间的 map
    
    // 创建房间
    this._createRooms();
    
    // 构建频道
    var self = this;
    var channel = io.of('/rich');
    this._channel = channel; 
    channel.on('connection', function (socket) {
        //console.log(socket.handshake.headers);
        var client_ip = socket.request.connection.remoteAddress;
        var req = socket.request;
        var sid = socket.id;
        console.log('a user connected, ip : %s', client_ip);
        
        // 保存 socket 对象
        self._sockets[sid] = socket;
        // 创建玩家
        self._createPlayer(sid);

        // 匹配玩家
        socket.on("cs_match", function(msg) {
            console.log("======== STRAT MATCH ========");
            var roomId = self._defaultRoomId;
            self._joinRoom(sid, roomId);
        });

        // 开始游戏
        socket.on("cs_start", function(msg) {
            console.log("======= DICE ========");
        });
        
        // 开始游戏
        socket.on("cs_dice", function(msg) {
            console.log("======= GMAE START ========");
        });
        
        // 用户离开
        socket.on('disconnect', function() {
            self._removePlayer(sid);
        });
    });
};

/**
 * 创建房间
 */
Rich.prototype._createRooms = function () {
    function genRoom() {
        var id = require('shortid').generate(); // 用户 id
        var room = {
            'id': id,
            'name': "富甲天下",
            'player_num': 0,
            'players': {},
            'game': { //游戏数据
                'status' : 0
            }
        };
        return room;
    }
    var id = null;
    for (var i = 0; i < this._conf.max_rooms; i++){
        var room = genRoom();
        id = room['id'];
        this._rooms[id] = room;
    }
    this._defaultRoomId = id;
};


Rich.prototype._newGame = function () {
};

/**
 * 加入房间
 */
Rich.prototype._joinRoom = function (sid, roomId) {
    var socket = this._sockets[sid];
    if (!(roomId in this._rooms)) {
        socket.emit('sc_enter_room', {
            'errno': 1,
            'data': {},
            'msg': '房间不存在'
        });
        return false;
    }
    
    // 是否超出人数限制
    var rooms = this._rooms;
    if(rooms.player_num == this._conf.max_players_per_room){
        socket.emit('sc_join_room', {
            'errno': 1,
            'data': {},
            'msg': '房间已满'
        });
        return false;
    }
    var room = rooms[roomId];
    room.players[sid] = {
        'state' : 1
    };
    room.player_num++;
    this._sidToRoomMap[sid] = roomId; //存入映射表
    
    // 加入房间
    socket.join(roomId); 
    //广播有玩家加入
    this._channel.to(roomId).emit('sc_user_enter_room', {
        'errno': 0,
        'data': room,
        'msg': '进入房间成功'
    });
};

/**
 * 离开房间
 */
Rich.prototype._leaveRoom = function (sid) {
    var roomId = this._sidToRoomMap[sid];
    var rooms = this._rooms;
    if (typeof roomId === 'string') {
        // to do ，有人离开房间时 游戏结束？
    }
};

/**
 * 创建玩家
 */
Rich.prototype._createPlayer = function (sid) {
    var names = ['', '粥弘一', '哩焉鸿', '玛芸', '麻花藤'];
    var total = this._players.total;
    var no = total + 1; // 当前玩家编号
    if (no > this._conf.max_players) {
        this._sockets['sid'].emit('sc_create_player', {
            'errno': 1,
            'data': null,
            'msg': '玩家已满'
        });
        return null;
    }
    
    var id = require('shortid').generate(); // 用户 id
    var player = {
        'id': id,
        'no': no,
        'name': names[no]
    };
    this._players.total = no;
    this._players.items[sid] = player;
    this._sockets[sid].emit('sc_create_player', {
        'errno': 0,
        'data': player,
        'msg': 'connected...'
    });
    return player;
};

/**
 * 删除玩家
 */
Rich.prototype._removePlayer = function(sid){
    if (sid in this._players.items) {
        delete this._players.items[sid];
        this._players.total = Math.max(0, this._players.total - 1);
    }
    delete this._sockets[sid];
};

/**
 * 创建地图
 */
Rich.prototype.createMap = function () {
};


/**
 * 游戏运算逻辑
 */
function Game() {
}

exports.Rich = Rich;