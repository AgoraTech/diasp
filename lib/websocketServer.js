"use strict";

var
    util = require('util'),
    events = require('events'),
    http = require('http'),
    WebsocketServer = require('websocket').server,

    op = null,
    o = function(options) {

        var
            httpServer = http
                .createServer(function(req, res) {
                    res.writeHead(200);
                    res.end();
                })
                .listen(options.port);

        this.acceptableResources = options.resourceList;
        this.hostMap = options.hostMap || {};

        this.websocketServer = new WebsocketServer({
            httpServer: httpServer,
            autoAcceptConnections: false
        });

        this.websocketServer.on('request', this.onConnection.bind(this));

    };

util.inherits(o, events.EventEmitter);
op = o.prototype;

op.onConnection = function(request) {

    var
        resourceName = request.resourceURL.path,
        host = request.httpRequest.headers.host.replace(/:.*$/, ''),
        connection = null,
        
        client = new events.EventEmitter;
    
    if (!resourceName || resourceName == '/') {
        if (this.hostMap[host]) resourceName = this.hostMap[host];
    }

    if (~this.acceptableResources.indexOf(resourceName)) {

        connection = request.accept(request.httpRequest.headers['sec-websocket-protocol'], request.origin),
        client.send = function(data) {
            connection.sendUTF(JSON.stringify(data));
        }

        connection.on('close', function() {
            client.emit('disconnected');
        }.bind(this));

        this.emit('new client', { accepted: true, resourceName: resourceName, client: client });

    } else {
        this.emit('new client', { accepted: false });
    }

};

module.exports = o;

