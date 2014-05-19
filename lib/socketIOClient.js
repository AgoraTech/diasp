"use strict";

var
    util = require('util'),
    events = require('events'),
    io = require('socket.io-client'),

    op = null,
    o = function(options) {

        this.client = io.connect(options.host + ':' + options.port, {
            'force new connection': true,
            'reconnect': false
        });

        this.client.on('connect', this.onConnect.bind(this));
        this.client.on('connecting', this.onConnecting.bind(this));
        this.client.on('disconnect', this.onDisconnect.bind(this));
        this.client.on('error', this.onError.bind(this));
        this.client.on('notice', this.onData.bind(this));

    };

util.inherits(o, events.EventEmitter);
op = o.prototype;

op.disconnect = function() {
    try {
        this.client.disconnect();
    } catch(e) {}
};

op.onConnect = function() {
    this.emit('connected');
};

op.onConnecting = function(transportType) {
    this.emit('connecting', transportType);
};

op.onDisconnect = function() {
    this.emit('disconnected');
};

op.onError = function(e) {
    this.emit('error', e);
};

op.onData = function(e) {
    this.emit('data', e);
};

module.exports = o;

