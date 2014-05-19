"use strict";

var
    util = require('util'),
    events = require('events'),
    WebsocketClient = require('websocket').client,

    op = null,
    o = function(options) {

        this.client = new WebsocketClient();

        this.client.on('connectFailed', this.onError.bind(this));

        this.client.on('connect', function(connection) {

            this.connection = connection;

            this.emit('connected');

            connection.on('close', this.onDisconnect.bind(this));
            connection.on('error', this.onError.bind(this));
            connection.on('message', this.onData.bind(this));

        }.bind(this));

        this.client.connect(options.host + ':' + options.port);

    };

util.inherits(o, events.EventEmitter);
op = o.prototype;

op.disconnect = function() {
    try {
        this.connection.close();
    } catch(e) {}
};

op.onDisconnect = function() {
    this.emit('disconnected');
};

op.onError = function(e) {
    this.emit('error', e);
};

op.onData = function(e) {
    this.emit('data', e.utf8Data);
};

module.exports = o;

