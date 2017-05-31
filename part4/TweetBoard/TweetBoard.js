var http = require('http'),
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser');
var localCacheAPI = require("./local-cache-api.js");
var localLoggerAPI = require("./local-logger-api.js");
var eventBusPublisher = require("./EventPublisher.js");
var eventBusConsumer = require("./EventConsumer.js");

var workflowEventsTopic = "workflowEvents";
var PORT = process.env.APP_PORT || 8096;
var APP_VERSION = "0.8"
var APP_NAME = "TweetBoard"

var TweetBoardCaptureActionType = "TweetBoardCapture";
var tweetBoardDocumentKey = "tweetboard-document";


console.log("Running " + APP_NAME + "version " + APP_VERSION);


var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
  console.log('Microservice' + APP_NAME + ' running, Express is listening... at ' + PORT + " for /ping, /about and /tweetBoard API calls");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));
app.get('/about', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("About TweetBoard API, Version " + APP_VERSION);
  res.write("Supported URLs:");
  res.write("/ping (GET)\n;");
  res.write("/tweetBoard (GET)");
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

app.get('/tweetBoard', function (req, res) {
  // Get the key and value
  console.log('TweetBoard - get document tweetboard from cache');
  var responseBody = { "result": "to be fetched from cache", "motivation": "to be provided" };
  localCacheAPI.getFromCache(tweetBoardDocumentKey, function (document) {
    console.log("tweetboard document retrieved from cache");
    // Send the response
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });
});

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
    localCacheAPI.getFromCache(tweetBoardDocumentKey, function (doc) {
      console.log("tweetboard document retrieved from cache");
      // what if document does not yet exist? initialize it!
      if (!doc || doc==null) {
        doc = {"tweets":[]};
      }
      for (i = 0; i < event.actions.length; i++) {
        var action = event.actions[i];
        // find action of type ValidateTweet
        if (TweetBoardCaptureActionType == action.type) {
          // check conditions
          if ("new" == action.status
            && conditionsSatisfied(action, event.actions)) {
            var workflowDocument;
            // add workflow tweet payload to the tweetboard document
            // reverse messages to have last/most recent one first
            doc.tweets.reverse();
            doc.tweets.push(event.payload);
            // most recent ones at the top
            doc.tweets.reverse();
            // retain no more than 25 entries
            doc.tweets = doc.tweets.slice(0, 25);

            localLoggerAPI.log("Added Tweet to TweetBoard - (workflowConversationIdentifier:" + event.workflowConversationIdentifier + ")"
              , APP_NAME, "info");
            // update action in event
            action.status = 'complete';
            // add audit line
            event.audit.push(
              { "when": new Date().getTime(), "who": "TweetBoard", "what": "update", "comment": "Tweet Board Capture done" }
            );
            acted = true;
          }
        }// if TweetBoardCaptureActionType
        else {
          // localLoggerAPI.log("Conditions not (yet) met for action " + action.id + " - (workflowConversationIdentifier:" + event.workflowConversationIdentifier + ")"
          //   , APP_NAME, "debug");

        }
        // if any action performed, then republish workflow event and store routingslip in cache
      }//for
      if (acted) {
        // PUT Workflow Document back  in Cache under workflow event identifier
        localCacheAPI.putInCache(event.workflowConversationIdentifier, event,
          function (result) {
            console.log("store workflowevent plus routing slip in cache under key " + event.workflowConversationIdentifier + ": " + JSON.stringify(result));
          });

        event.updateTimeStamp = new Date().getTime();
        event.lastUpdater = APP_NAME;
      // publish event
      eventBusPublisher.publishEvent('OracleCodeTwitterWorkflow' + event.updateTimeStamp,event, workflowEventsTopic);

        // put tweetboard document in the cache
        localCacheAPI.putInCache(tweetBoardDocumentKey, doc,
          function (result) {
            console.log("stored tweetboard document cache under key " + tweetBoardDocumentKey + ": " + JSON.stringify(result));
          });

      }// acted
    });//getFromCache
  }// if actions
}// handleWorkflowEvent

function conditionsSatisfied(action, actions) {
  var satisfied = true;
  // verify if conditions in action are methodName(params) {
  //   example action: {
  //   "id": "CaptureToTweetBoard"
  // , "type": "TweetBoardCapture"
  // , "status": "new"  // new, inprogress, complete, failed
  // , "result": "" // for example OK, 0, 42, true
  // , "conditions": [{ "action": "EnrichTweetWithDetails", "status": "complete", "result": "OK" }]
  for (i = 0; i < action.conditions.length; i++) {
    var condition = action.conditions[i];
    if (!actionWithIdHasStatusAndResult(actions, condition.action, condition.status, condition.result)) {
      satisfied = false;
      break;
    }
  }//for
  return satisfied;
}//conditionsSatisfied

function actionWithIdHasStatusAndResult(actions, id, status, result) {
  for (i = 0; i < actions.length; i++) {
    if (actions[i].id == id && actions[i].status == status && actions[i].result == result)
      return true;
  }//for
  return false;
}//actionWithIdHasStatusAndResult

