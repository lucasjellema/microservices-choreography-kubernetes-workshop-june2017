//respond to HTTP requests with response: count of number of requests
// invoke from browser or using curl:  curl http://127.0.0.1:PORT
var http = require('http');

var requestCounter =0 ;

var PORT = process.env.APP_PORT || 3000;

var server = http.createServer(function handleRequest(req, res) {
    res.write('Request Count: '+ ++requestCounter);
    res.end();
}).listen(PORT);

console.log('server running on port '+PORT);