DIASP
=====

About
-----

DIASP is acronym for **D**iasp **I**s **A** **S**ocket **P**roxy. Strangely enough, it actually is an (one way) socket proxy. It has support for [Worlize Websockets](https://github.com/Worlize/WebSocket-Node) and [Socket.IO](http://socket.io). It has modular build, so support for other types of socket connections may be added with ease. It is capable of proxying one type of connection to another, for example you may have client which connects to DIASP with Socket.IO while DIASP is connected to resource server with Worlize Websocket: data from resource server will be passed to client nevertheless.

Usage
-----

DIASP is a library, not a standalone application. To use it, simply add a dependency to your code to diasp, next add require and create new instance of DiaspServer configuring it with options passed to constructor:

    var Diasp = require('diasp');
    var MyDiaspServer = new DiaspServer(options);

Configuration object must contain:

* list of *resources* (`options.resources`). Resource is data source that will be accessible by clients via DIASP. Each resource may be spread between many different servers (as long as they work in exactly same way);
* list of *servers* (`options.servers`). End clients will be able to connect to these servers to retrieve data from resources;

Configuration object may contain:

* list of *host mappings* (`options.hostMap`). This list is used to map hosts to actual resources and may be helpful in some cases.

### Configuring resources

`options.resources` is a hash of arrays of objects. Name (key) of each array in this hash has to start with `/` character and must contain at least one character besides `/`. Client will be passing this name in URL (as request path), so it is not wise to use any characters that should not appear in URL here.

Arrays in this hash are lists of servers that are serving data associated with specific resource. Object describing a server must have exactly three fields:

* `host`: hostname of server;
* `port`: server's listening port;
* `connectionType`: `websocket` or `socket.io`.

### Configuring servers

`options.servers` is a hash of objects. Names (keys) in this hash do not matter at all. Each object in this hash describes a server that can be connected to by end client and must contain following fields:

* `path`: path to server module. If you are not extending DIASP by adding new modules, you can use `./socketIOServer` or `./websocketServer`;
* `port`: port on which server will be listening.
 
You may specify as many servers as you want, using different server modules and different port. Each server will be available all the time and every client will be able to connect to each resource using the server of their choice. 

### Configuring host maps

`options.hostMap` is a hash of strings. Name (key) of each string in this hash is actually a hostname that is mapped to resource specified by this string. For example, if you have resource called `/sample` and you want users to be able to access it via `example.com` host, you may add following pair to `hostMap`:

    options.hostMap['example.com'] = '/sample';

Obviously, there may be many hosts mapped to same resource.

How does DIASP work?
--------------------

During initialization DIASP sets up servers specified in `options.servers` hash. These servers start to listen immediately. When a new client connects to any of these servers, the following happens:

1. DIASP checks hostname in client request headers. If this hostname can be found in `hostMap`, server assumes that client wants to start receiving data from this resource. If the hostname doesn't match with `hostMap`, server checks path in requested URL. If this path is a valid resource name, this resource will be used. If both of these checks fail, client will be disconnected;
1. DIASP checks whether it is connected to resource specified in previous step. If it is, it starts pushing data received from resource to this client. If it is not, is will pick one server from list specified in `options.resource[x]` array (where `x` is name of resource) randomly (and then it starts pushing data received from resource to this client). As far as you can see, there is only one connection established from DIASP to resource server, no matter how many clients are receiving data from it;
1. When a clients disconnects, DIASP checks whether there are more clients connected to given resource or not. If not, it disconnects from this resource;
1. There is no way from client to send anything to resource server; everything received from client by DIASP is simply ignored (DIASP is one way proxy after all).

Customizing DIASP
-----------------

You may add your custom servers easily. Just take a look how `lib/socketIOServer.js` and `lib/websocketServer.js` are done and follow the same pattern. Server will always be invoked with `options` object containing following fields:

* `port`: port to listen on;
* `resourceList`: list of available resources (which is array containing names of these resources stored as strings);
* `hostMap` (optional): hash of strings with host mapping information. Every key in this hash is a hostname and every string is a name of resource associated with this hostname.

After creating new server module you may use it by setting path to it within server configuration hash (see "Configuring servers" section above).

Adding new ways to connect to resource servers is similar, but a bit more tricky. To create new client module you should follow pattern in `lib/socketIOClient.js` and `lib/websocketClient.js`. To make this client available for use, you will have to modify `lib/diaspResource.js` file. First, you need to require your new module in same way that default ones are. The list of clients is specified in switch in function `connect` - you need to add new `case` statement which matches name of your server and contains invocation of your new class constructor.

Samples and detailed documentation
----------------------------------

Coming soon...

