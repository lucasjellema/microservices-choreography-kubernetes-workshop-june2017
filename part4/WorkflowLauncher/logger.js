var request = require('request')
    ;
var settings = require("./proxy-settings.js");

var logger = module.exports;

var loggerRESTAPIURL = "http://129.144.151.143/SoaringTheWorldAtRestService/resources/logger/log";
var apiURL = "/logger-api";
var eventhubAPI = require("./eventhub-api.js");

logger.DEBUG = "debug";
logger.INFO = "info";
logger.WARN = "warning";
logger.ERROR = "error";

logger.log =
    function (message, moduleName, loglevel) {

        /* POST:
      
  {
      "logLevel" : "info"
      ,"module" : "soaring.clouds.accs.artist-api"
      , "message" : "starting a new logger module - message from ACCS"
  	
  }
  */
        var logRecord = {
            "logLevel": loglevel
            , "module": "soaring.clouds." + moduleName
            , "message": message

        };
        var args = {
            data: JSON.stringify(logRecord),
            headers: { "Content-Type": "application/json" }
        };

        var route_options = {};


            var msg = {
                "records": [{
                    "key": "log", "value": {
                        "logLevel": loglevel
                        , "module": "soaring.clouds." + moduleName
                        , "message": message
                        , "timestamp": Date.now()

                    }
                }]
            };

           eventhubAPI.postMessagesToEventHub(msg
                , function (response) {
                    console.log("Published log-record to Kafka- response" + JSON.stringify(response));
                });

/* no more direct publication to REST API - now go through Kafka
        // Issue the POST  -- the callback will return the response to the user
        route_options.method = "POST";
        //            route_options.uri = baseCCSURL.concat(cacheName).concat('/').concat(keyString);
        route_options.uri = loggerRESTAPIURL;
        console.log("Logger Target URL " + route_options.uri);

        route_options.body = args.data;
        route_options.headers = args.headers;

        request(route_options, function (error, rawResponse, body) {
            if (error) {
                console.log(JSON.stringify(error));
            } else {
                console.log(rawResponse.statusCode);
                console.log("BODY:" + JSON.stringify(body));
            }//else

        });//request
*/

    }//logger.log

logger.registerListeners =
    function (app) {
        app.post(apiURL, function (req, res) {
            // Get the key and value
            console.log('Logger-API POST - now show params');
            console.log('body in request' + JSON.stringify(req.body));
            console.log("content type " + req.headers['content-type']);
            var logRecord = req.body;
            console.log("value submitted in POST to be logged " + JSON.stringify(logRecord));
            logger.log(logRecord.message, logRecord.module, logRecord.logLevel);
            var responseBody = {};
            responseBody['status'] = 'Successful.';
            // Send the response
            res.json(responseBody).end();

        });//post
    }//registerListeners

console.log("Logger API (version " + settings.APP_VERSION + ") initialized at " + apiURL + " running against Logger Service URL " + loggerRESTAPIURL);
