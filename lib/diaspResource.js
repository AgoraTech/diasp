"use strict";

var
    util = require('util'),
    events = require('events'),
    SocketIOClient = require('./socketIOClient.js'),
    WebsocketClient = require('./websocketClient.js'),

    uniq = 0,

    op = null,
    o = function(options) {

        this.clients = {};
        this.clientCount = 0;

        this.name = options.resourceName;
        this.resourceOptions = options.resource;

        this.resourceClient = null;
        this.status = 'not connected';

    };

util.inherits(o, events.EventEmitter);
op = o.prototype;

op.addClient = function(client) {

    client.id = uniq++;

    this.clients[client.id] = client;

    client.on('disconnected', function() {

        this.clientCount--;
        delete this.clients[client.id];

        this.emit('client disconnected', { remainingClients: this.clientCount });

        // If there are no more clients connected to this resource, we may disconnect from
        // resource server as well.

        if (!this.clientCount) {
            this.status = 'disconnecting';
	    if (this.resourceClient) this.resourceClient.disconnect();
        }

    }.bind(this));

    this.clientCount++;

    this.emit('new client accepted', { client: client, status: this.status });

    // If resource is not connected (and is not attempting to connect already) to resource server,
    // it will try to connect to one of servers specified in config

    if (this.status == 'not connected') {
        this.connect();
    }

    // If status is anything else than "not connected", there is no need to do anything:
    //
    // - status="connected" - in this case resource is already connected to resource server.
    // - status="disconnecting" - resource is disconnecting from resource server. Once disconnected,
    //   it should realize that new client has been connected in meanwhile and try to reconnect.
    // - status="connecting" - resource is connecting to resource server already.

};

op.connect = function() {

    var
	i = ~~(Math.random() * this.resourceOptions.length),
        data = this.resourceOptions[i];

    this.status = 'connecting';

    switch (data.connectionType) {

    case 'websocket':

        this.resourceClient = new WebsocketClient(data);
        break;

    case 'socket.io':

        this.resourceClient = new SocketIOClient(data);
        break;

    }

    this.resourceClient.on('connected', this.onConnect.bind(this));
    this.resourceClient.on('connecting', this.onConnecting.bind(this));
    this.resourceClient.on('disconnected', this.onDisconnect.bind(this));
    this.resourceClient.on('data', this.onData.bind(this));
    this.resourceClient.on('error', this.onError.bind(this));

};

op.onConnect = function() {

    this.status = 'connected';
    this.emit('connected');

};

op.onConnecting = function(transportType) {

    this.emit('connecting', { transportType: transportType });

};

op.onDisconnect = function() {

    this.status = 'not connected';
    delete this.resourceClient;

    // If there are some clients still connected to this resource, it will attempt to reconnect
    // to resource server.

    if (this.clientCount) {
        setTimeout(function() {
            this.connect();
        }.bind(this), 5000);
    }

    this.emit('disconnected', { willReconnect: !!this.clientCount });

};

op.onData = function(data) {

    var i = '';

    // Pass data to all clients connected to this resource.

    for (i in this.clients) {
        this.clients[i].send(data);
    }

    this.emit('data', { data: data });

};

op.onError = function(e) {

    this.emit('error', { error: e });

    if (this.resourceClient && this.resourceClient.connected) {

        // In this case error wasn't "fatal" and connection to resource server is still established.
        // Resource will disconnect manually. After that event "disconnect" should be fired and
        // handled by "onDisconnect" function (which should reestablish connection, given there are
        // still any clients connected to this resource).

        this.status = 'disconnecting';
        this.resourceClient.disconnect();

    } else {

        // In this case error caused disconnection from resource server. Function "onDisconnect" will
        // be simply called manually.

        this.onDisconnect();

    }

};

module.exports = o;

