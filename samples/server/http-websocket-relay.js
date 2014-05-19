var
    WSServer = require('websocket').server,
    wsServer = null,
    http = require('http'),
    connections = {},
    uniq = 0,
    
    httpServer = http.createServer(function(req, res) {

        var data = '', i = '';

        req.on('data', function(chunk) {
            data += chunk;
        });

        req.on('end', function() {

            var json = {};

            if (data) {
                data.split(/&/).map(function(item) {
                    var it = item.split(/=/);
                    json[it[0]] = it[1];
                });

                for (i in connections) {
                    connections[i].sendUTF(JSON.stringify(json));
                }

            }

            res.writeHead(200, { 'Content-type': 'text/html; charset=utf-8' });
            res.end('<header>http to websocket relay</header><form action="/" method="post"><p><label>Tekst: <input type="text" name="msg"></label></p><p><label>URL: <input type="text" name="uri"></label></p><p><button>go</button></p></form>'); 

        });

    });

httpServer.listen(6101);

wsServer = new WSServer({
    httpServer: httpServer,
    autoAcceptConnections: false
});

wsServer.on('request', function(request) {

    var
        id = uniq++,
        connection = request.accept(request.httpRequest.headers['sec-websocket-protocol'], request.origin);

    connections[id] = connection;
    connection.on('close', function() {
        delete connections[id];
    });

});

