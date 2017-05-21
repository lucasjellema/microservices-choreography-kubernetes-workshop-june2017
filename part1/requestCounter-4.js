//respond to HTTP requests with response: count of number of requests
// invoke from browser or using curl:  curl http://127.0.0.1:PORT
// use an optmistic locking strategy to prevent race conditions between multiple clients updating the requestCount at the same time
// based on https://blog.yld.io/2016/11/07/node-js-databases-using-redis-for-fun-and-profit/#.WSGEWtwlGpo 
var http = require('http');
var Redis = require("redis");

var redisHost = process.env.REDIS_HOST || "192.168.99.100";
var redisPort = process.env.REDIS_PORT || 6379;

var PORT = process.env.APP_PORT || 3000;

var redisKeyRequestCounter = "requestCounter";

var server = http.createServer(function handleRequest(req, res) {
    increment(redisKeyRequestCounter, function (err, newValue) {
        if (err) {
            res.write('Request Count (Version 3): ERROR ' + err);
            res.end();
        } else {
            res.write('Request Count (Version 3): ' + newValue);
            res.end();
        }
    })
}).listen(PORT);


function _increment(key, cb) {
    var replied = false;
    var newValue;

    var redis = Redis.createClient({ "host": redisHost, "port": redisPort });
    // if the key does not yet exist, then create it with a value of zero associated with it
    redis.setnx(key, 0);
    redis.once('error', done);
    // ensure that if anything changes to the key-value pair in Redis (from a different connection), this atomic operation will fail
    redis.watch(key);
    redis.get(key, function (err, value) {
        if (err) {
            return done(err);
        }
        newValue = Number(value) + 1;
        // either watch tells no change has taken place and the set goes through, or this action fails
        redis.multi().
            set(key, newValue).
            exec(done);
    });

    function done(err, result) {
        redis.quit();

        if (!replied) {
            if (!err && !result) {
                err = new Error('Conflict detected');
            }

            replied = true;
            cb(err, newValue);
        }
    }
}

function increment(key, cb) {
    _increment(key, callback);

    function callback(err, result) {
        if (err && err.message == 'Conflict detected') {
            _increment(key, callback);
        }
        else {
            cb(err, result);
        }
    }
}


console.log('Node.JS Server running on port ' + PORT + ' for version 3 of requestCounter application, powered by Redis.');