var GameServer = require('./game_server.js');
var server = new GameServer({
    'port': 8081,
    'static_prefix': '/static',
    'static_path': '../static'
});

server.start();
var Rich = require('./rich').Rich;
var game = new Rich(server.io);