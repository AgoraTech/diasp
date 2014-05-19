"use strict";

var
    util = require('util'),
    events = require('events'),
    http = require('http'),
    socketio = require('socket.io'),

    op = null,
    o = function(options) {

        var
            i = 0,
            httpServer = http
                .createServer(function(req, res) {
                    res.writeHead(200);
                    res.end();
                })
                .listen(options.port);

        setInterval(this.checkClients.bind(this), 1000);

        this.clients = {};
        this.server = socketio.listen(httpServer);
        this.hostMap = options.hostMap || {};

        for (i = 0; i < options.resourceList.length; i++) {
            this.bindResource(options.resourceList[i]);
        }

        this.server.on('connection', function(socket) {

            var host = socket.namespace.manager.handshaken[socket.id].headers.host.replace(/:.*$/, '');

            if (this.hostMap[host]) {
                this.addClient(socket, this.hostMap[host]);
            } else {
                this.clients[socket.id] = Date.now();
            }

        }.bind(this));

    };

util.inherits(o, events.EventEmitter);
op = o.prototype;

op.bindResource = function(resourceName) {

    this.server
        .of(resourceName)
        .on('connection', (function(socket) {
            if (!this.clients[socket.id]) return;
            this.addClient(socket, resourceName);
        }).bind(this));

};

op.addClient = function(socket, resourceName) {

    var client = new events.EventEmitter;

    delete this.clients[socket.id];

    client.send = function(data) {
        socket.emit('notice', data);
    };

    socket.on('disconnect', function() {
        client.emit('disconnected');
    }.bind(this));

    this.emit('new client', { accepted: true, client: client, resourceName: resourceName });

}

op.checkClients = function() {

    var
        prev = Date.now() - 1000,
        i = '';

    for (i in this.clients) {

        if (this.clients[i] < prev) {
            this.emit('new client', { accepted: false });
            delete this.clients[i];
        }

    }

};

module.exports = o;

