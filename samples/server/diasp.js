var
    http = require('http'),

    DiaspServer = require('../../lib/diaspServer.js'),

    ts = function() {

        var date = new Date();
    
        return [
            '[' +
            date.getFullYear() + '-' + 
            ('0' + (date.getMonth() + 1)).slice(-2) + '-' + 
            ('0' + date.getDate()).slice(-2) + ' ' +
            ('0' + date.getHours()).slice(-2) + ':' +
            ('0' + date.getMinutes()).slice(-2) + ':' +
            ('0' + date.getSeconds()).slice(-2) + 
            ']'
       ];
      
    },

    diasp = new DiaspServer({

        resources: {
            '/sample': {
                 host: 'localhost',
                 port: 6101,
                 path: '/testme'
            },
            '/sample2': {
                 host: 'localhost',
                 port: 6102,
                 path: '/testme'
            }
        },

        servers: [
            {
                port: 8100,
                path: './socketIOServer'
            },
            {
                port: 8101,
                path: './websocketServer'
            }
        ]

    }),
    
    bindEvents = function(resourceName) {

        var resource = diasp.getResource(resourceName);

        resource.on('new client accepted', function(e) {
            console.log(ts() + ' [' + resourceName + '] New client accepted');
        });
        
        resource.on('app-config error', function(e) {
            console.log(ts() + ' [' + resourceName + '] App-config error');
            console.log(e);
        });
        
        resource.on('connected', function(e) {
            console.log(ts() + ' [' + resourceName + '] Connected to resource server');
        });
        
        resource.on('connecting', function(e) {
            console.log(ts() + ' [' + resourceName + '] Connecting to resource server via ' + e.transportType);
        });
        
        resource.on('disconnected', function(e) {
            console.log(ts() + ' [' + resourceName + '] Disconnected from resource server (willReconnect: ' + e.willReconnect + ')');
        });
        
        resource.on('data', function(e) {
            console.log(ts() + ' [' + resourceName + '] Received data from resource server');
            console.log(e);
        });
        
        resource.on('app-config data', function(e) {
            console.log(ts() + ' [' + resourceName + '] Received data from app-config');
            console.log(e);
        });
        
        resource.on('app-config connecting', function(e) {
            console.log(ts() + ' [' + resourceName + '] Connecting to app-config');
        });
        
        resource.on('error', function(e) {
            console.log(ts() + ' [' + resourceName + '] network error');
            console.log(e);
        });
        
        resource.on('client disconnected', function(e) {
            console.log(ts() + ' [' + resourceName + '] client disconnected');
            console.log(e);
        });

    };

http.createServer(function(req, res) {

    var resource = diasp.getResource(req.url);

    if (resource) 
        console.log('resource exists'); 
    else 
        console.log('resource doesn\'t exist');
    
    if (!resource || !resource.getServerStatus()) {
        res.writeHead(500);
    } else {
        res.writeHead(200);
    }
    
    res.end();

}).listen(8200);

diasp.on('new client refused', function(e) {
    console.log(ts() + ' New client refused');
});

bindEvents('/sample');
bindEvents('/sample2');
