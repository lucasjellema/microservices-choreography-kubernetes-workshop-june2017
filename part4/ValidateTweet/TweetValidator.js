var http = require('http'),
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser');
var localCacheAPI = require("./local-cache-api.js");
var localLoggerAPI = require("./local-logger-api.js");
var eventBusPublisher = require("./EventPublisher.js");
var eventBusConsumer = require("./EventConsumer.js");


var workflowEventsTopic = "workflowEvents";
var PORT = process.env.APP_PORT || 8091;
var APP_VERSION = "0.8"
var APP_NAME = "TweetValidator"

console.log("Running TweetValidator version " + APP_VERSION);


var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
  console.log('Server running, Express is listening... at ' + PORT + " for /ping, /about and /tweet TweetValidator API calls");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));
app.get('/about', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("About TweetValidator API, Version " + APP_VERSION);
  res.write("Supported URLs:");
  res.write("/ping (GET)\n;");
  res.write("/tweet (POST)");
  res.write("NodeJS runtime version " + process.version);
  res.write("incoming headers" + JSON.stringify(req.headers));
  res.end();
});

app.get('/ping', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("Reply");
  res.write("incoming headers" + JSON.stringify(req.headers));
  res.end();
});

app.post('/tweet', function (req, res) {
  // Get the key and value
  console.log('TweetValidator - validate tweet');
  console.log('body in request' + JSON.stringify(req.body));
  console.log("content type " + req.headers['content-type']);
  var tweet = req.body;
  var validation = validateTweet(tweet);
  var responseBody = { "result": validation.result, "motivation": validation.motivation };
  // Send the response
  res.setHeader('Content-Type', 'application/json');
  res.send(responseBody);

});

function validateTweet(tweet) {
  var outcome = {};
  outcome.result = "OK";
  outcome.motivation = "perfectly ok tweet according to our current set of rules";
  var valid = true;
  var reason="Not OK because:";
  console.log("validate tweet " + JSON.stringify(tweet));
  // if tweet is retweet, then no good
  if (tweet.text.startsWith("RT")) {
     valid = false;
     reason= reason + "Retweets are not accepted. ";
  }
  if (tweet.author == "johndoe" || tweet.author == "john.doe") {
     valid = false;
     reason= reason + "No fake authors (John Doe is not acceptable). ";
  }
  if (tweet.text.indexOf("Trump ") > -1 ||tweet.text.toLowerCase().indexOf("brexit")>-1||tweet.text.toLowerCase().indexOf("elections")>-1) {
     valid = false;
     reason= reason + "No Political Statements are condoned today. ";
  }
  if (!valid) {
    outcome.result = "NOK";
    outcome.motivation = reason;    
  }
  return outcome;
}

// configure Kafka interaction
eventBusConsumer.registerEventHandler(workflowEventsTopic, handleWorkflowEvent);


function handleWorkflowEvent(eventMessage) {
  var event = JSON.parse(eventMessage.value);
  console.log("received message", eventMessage);
  console.log("received message object", JSON.stringify(eventMessage));
  console.log("actual event: " + JSON.stringify(event));

  // event we expect is of type workflowEvents
  // we should do something with this event if it contains an action (actions[].type='ValidateTweet' where status ="new" and conditions are satisfied)

  if (event.actions) {
    var acted = false;
    for (i = 0; i < event.actions.length; i++) {
      var action = event.actions[i];
      // find action of type ValidateTweet
      if ("ValidateTweet" == action.type) {
        // check conditions
        if ("new" == action.status) {
          var workflowDocument;
          localCacheAPI.getFromCache(event.workflowConversationIdentifier, function (document) {
            console.log("Workflow document retrieved from cache");
            var workflowDocument = document;
            // this happens  asynchronously; right now we do not actually use the retrieved document. It does work.       
          });
          // if satisfied, then validate tweet
          var outcome = validateTweet(event.payload);

          // update action in event
          action.status = 'complete';
          action.result = outcome.result;
          // add audit line
          event.audit.push(
            { "when": new Date().getTime(), "who": "TweetValidator", "what": "update", "comment": "Tweet Validation Complete" }
          );

          acted = true;
          localLoggerAPI.log("Validated Tweet (outcome:" + JSON.stringify(outcome) + ")"
            + " - (workflowConversationIdentifier:" + event.workflowConversationIdentifier + ")"
            , APP_NAME, "info");

        }
      }// if ValidateTweet
      // if any action performed, then republish workflow event and store routingslip in cache
    }//for
    if (acted) {
      event.updateTimeStamp = new Date().getTime();
      event.lastUpdater = APP_NAME;
      // publish event
      eventBusPublisher.publishEvent('OracleCodeTwitterWorkflow' + event.updateTimeStamp,event, workflowEventsTopic);

      // PUT Workflow Document back  in Cache under workflow event identifier
      localCacheAPI.putInCache(event.workflowConversationIdentifier, event,
        function (result) {
          console.log("store workflowevent plus routing slip in cache under key " + event.workflowConversationIdentifier + ": " + JSON.stringify(result));
        });
    }// acted
  }// if actions
}// handleWorkflowEvent