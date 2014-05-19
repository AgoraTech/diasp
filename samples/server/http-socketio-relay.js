var
    io = require('socket.io'),
    http = require('http'),
    ioServer = null,

    httpServer = http
        .createServer(function(req, res) {
    
            var data = '';
    
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
                    ioServer.sockets.emit('notice', JSON.stringify(json));
                }
    
                res.writeHead(200, { 'Content-type': 'text/html; charset=utf-8' });
                res.end('<header>http to socket.io relay</header><form action="/" method="post"><p><label>Tekst: <input type="text" name="msg"></label></p><p><label>URL: <input type="text" name="uri"></label></p><p><button>go</button></p></form>'); 
    
            });
    
        })
        .listen(6102);

ioServer = io.listen(httpServer);

