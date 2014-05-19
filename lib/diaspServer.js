"use strict";

var
    events = require('events'),
    util = require('util'),
    DiaspResource = require('./diaspResource'),

    op = null,
    o = function(options) {

        var
            resourceList = [],
            Server = null,
            server = null,
            data = null,
            i = '';

        if (typeof options != 'object') {
            throw new Error('diaspServer: constructor requires configuration object');
        }

        // options.resources = {
        //     "resourceName": {
        //         host: "127.0.0.1",
        //         port: 7070,
        //         path: "/resource"
        //     }
        // }

        this.resources = {};

        if (options.resources) {
            for (i in options.resources) {
                data = options.resources[i];
                resourceList.push(i);
                this.resources[i] = new DiaspResource({
                    resourceName: i,
                    resource: data
                });
            }
        }

        if (!resourceList.length) {
            throw new Error('diaspServer: no resources in configuration object');
        }

        // options.servers = {
        //    "serverName": {
        //        port: 8080,
        //        path: './websocketServer'
        //    }
        // }

        if (!options.servers) {
            throw new Error('diaspServer: no servers in configuration object');
        }

        this.servers = [];
        
        for (i in options.servers) {

            data = options.servers[i];

            if (!data.path || !data.port) {
                throw new Error('diaspServer: invalid server configuration');
            }

            Server = require(data.path);

            this.servers.push(server = new Server({
                port: data.port,
                resourceList: resourceList,
                hostMap: options.hostMap
            }));

            server.on('new client', this.onClientConnected.bind(this));

        }

        if (!this.servers.length) {
            throw new Error('diaspServer: no servers in configuration object');
        }

    };

util.inherits(o, events.EventEmitter);
op = o.prototype;

op.getResource = function(resourceName) {

    return this.resources[resourceName];

};

op.onClientConnected = function(e) {

    if (e.accepted) {
        this.resources[e.resourceName].addClient(e.client);
    } else {
        this.emit('new client refused');
    }

};

module.exports = o;

