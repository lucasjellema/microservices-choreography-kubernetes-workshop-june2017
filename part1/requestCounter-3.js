//respond to HTTP requests with response: count of number of requests
// invoke from browser or using curl:  curl http://127.0.0.1:PORT
var http = require('http');
var redis = require("redis");

var redisHost = process.env.REDIS_HOST ||"192.168.99.100" ;
var redisPort = process.env.REDIS_PORT ||6379;

var redisClient = redis.createClient({ "host": redisHost, "port": redisPort });

var PORT = process.env.APP_PORT || 3000;

var redisKeyRequestCounter = "requestCounter";

var server = http.createServer(function handleRequest(req, res) {
    var requestCounter = 0;

    redisClient.get(redisKeyRequestCounter, function (err, reply) {
        if (err) {
            res.write('Request Count (Version 3): ERROR ' + err);
            res.end();
        } else {
            if (!reply || reply == null) {
                console.log("no value found yet");
                redisClient.set(redisKeyRequestCounter, requestCounter);
            } else {
                requestCounter = Number(reply) + 1;
                redisClient.set(redisKeyRequestCounter, requestCounter);
            }
            res.write('Request Count (Version 3): ' + requestCounter);
            res.end();
        }
    })
}).listen(PORT);

    //        redisClient.quit();

console.log('Node.JS Server running on port ' + PORT + ' for version 3 of requestCounter application, powered by Redis.');