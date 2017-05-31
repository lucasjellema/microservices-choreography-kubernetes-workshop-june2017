var http = require('http'),
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  eventBusPublisher = require("./EventPublisher.js");

var PORT = process.env.APP_PORT || 8095;
var APP_VERSION = "0.1.2"
var APP_NAME = "TweetReceiver"
var workflowEventsTopic = process.env.KAFKA_TOPIC ||"workflowEvents";

var moduleName = "TweetReceiver";

console.log("Running " + APP_NAME + "version " + APP_VERSION);


var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
  console.log('Microservice ' + APP_NAME + ' running, Express is listening... at ' + PORT + " for /ping, /about and /tweet calls");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));
app.get('/about', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("About " + APP_NAME + ", Version " + APP_VERSION);
  res.write("Supported URLs:");
  res.write("/ping (GET)\n;");
  res.write("/publish?field1=value&field2=value_2 (GET)");
  res.write("/tweet (POST)");
  res.write("NodeJS runtime version " + process.version);
  res.write("incoming headers" + JSON.stringify(req.headers));
  res.end();
});

app.get('/ping', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("Reply from " + APP_NAME);
  res.write("incoming headers" + JSON.stringify(req.headers));
  res.end();
});

app.get('/publish', function (req, res) {
  // create event document using parameters from HTTP GET request
  var event = { "meta": "Produced by " + APP_NAME + " (" + APP_VERSION + ") from an HTTP Request" };
  for (var queryParam in req.query) {
    if (req.query.hasOwnProperty(queryParam)) {
      event[queryParam] = req.query[queryParam];
    } //if
  } //for
  publishEvent(event);
  res.setHeader('Content-Type', 'application/json');
  var document = { "Result": "Published Event to Topic " + kafkaTopic };
  res.send(JSON.stringify(document));
});

/* Tweet:
 { "text":"Fake 2 #oraclecode Tweet @StringSection" 
             , "author" : "lucasjellema"
             , "authorImageUrl" : "http://pbs.twimg.com/profile_images/427673149144977408/7JoCiz-5_normal.png"
             , "createdTime" : "April 17, 2017 at 01:39PM"
             , "tweetURL" : "http://twitter.com/SaibotAirport/status/853935915714138112"
             , "firstLinkFromTweet" : "https://t.co/cBZNgqKk0U"
             }
*/

app.post('/tweet', function (req, res) {
  console.log('Tweet Receiver TWEET POST');
  console.log('body in request' + JSON.stringify(req.body));
  postNewTweet(req, res, req.body);
});//post messages


function postNewTweet(req, res, tweet) {
  eventBusPublisher.publishEvent("NewTweetEvent", {
    "tweet": tweet
    , "module": "soaring.clouds." + moduleName
    , "timestamp": Date.now()
  }, workflowEventsTopic);
  res.json({"result":"Tweet was received and published to topic "+workflowEventsTopic}).end();
}// postNewTweet