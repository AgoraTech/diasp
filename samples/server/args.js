var
    argv = process.argv,
    args = {};

argv.map(function(arg, i) {

    var m = null;

    if (i < 2) return;

    if (m = arg.match(/--([^=]*)(?:=(.*))?/)) {

        if (m[2]) {
            args[m[1]] = m[2];
        } else {
            args[m[1]] = true;
        }

    }

});

if (args.config) {

    (function() {
     
         var
             i = '',
             config = require(args.config);
         
         for (i in config) if (!(i in args)) args[i] = config[i];
    
    }());

};

module.exports = args;


