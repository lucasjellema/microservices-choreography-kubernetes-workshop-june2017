var request = require('request')
    ;


// Create a client that will "talk" to CCS
//var Client = require("node-rest-client").Client;

//var client = new Client();


var localCacheAPI = module.exports;
var moduleName = "accs.localCacheAPI";
var moduleVersion = "0.8.7";
var cacheAPIURL = "https://artist-enricher-api-partnercloud17.apaas.us6.oraclecloud.com/cache-api";


localCacheAPI.getFromCache = function (key, callback) {
    console.log("get document from cache api with key " + key);
    var route_options = {};

    // Issue the GET -- the callback will return the response to the user
    route_options.method = "GET";
    route_options.uri = cacheAPIURL.concat('/').concat(key);
    console.log("Target URL from CacheAPI" + route_options.uri);


    // Issue the GET -- our callback function will return the response
    // to the user
    request(route_options, function (error, rawResponse, body) {
        if (error) {
            console.log(JSON.stringify(error));
        } else {
            callback(JSON.parse(body).value);
        }//else
    });//request
}//getFromCache

localCacheAPI.putInCache = function (key, value, callback) {
    console.log("putInCache Callback = " + callback);
    // Build the args for the request
    var args = {
        data: JSON.stringify(value),
        headers: { "Content-Type": "application/json" }
    };
    var route_options = {};

    // Issue the PUT -- the callback will return the response to the user
    route_options.method = "PUT";

    route_options.uri = cacheAPIURL.concat('/').concat(key);
    console.log("Target URL " + route_options.uri);

    route_options.body = args.data;
    route_options.headers = args.headers;

    console.log("route_options:" + JSON.stringify(route_options));

    request(route_options, function (error, rawResponse, body) {
        if (error) {
            console.log(JSON.stringify(error));
            if (callback) { callback("error in call to cache " + JSON.stringify(error)) }
        } else {
            console.log(rawResponse.statusCode);
            console.log("BODY:" + JSON.stringify(body));
            console.log("XXXXXXXXXXXXXXXXXXXX  BODY2:" + JSON.stringify(body));
            // Proper response is 204, no content.
            var responseBody = {};
            responseBody['status'] = 'PUT returned '.concat(rawResponse.statusCode.toString());

            if (callback) { callback(responseBody) }
        }//else
    });//request

}//putInCache


console.log("Local Cache API (version " + moduleVersion + ") initialized running against CACHE Service URL " + cacheAPIURL);
