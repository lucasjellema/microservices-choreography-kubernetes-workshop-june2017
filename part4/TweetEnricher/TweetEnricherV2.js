var http = require('http'),
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser');
var localCacheAPI = require("./local-cache-api.js");
var localLoggerAPI = require("./local-logger-api.js");
var eventBusPublisher = require("./EventPublisher.js");
var eventBusConsumer = require("./EventConsumer.js");

var workflowEventsTopic = "workflowEvents";
var PORT = process.env.APP_PORT || 8098;
var APP_VERSION = "0.26"
var APP_NAME = "TweetEnricher"

var TweetEnricherActionType = "EnrichTweet";

console.log("Running " + APP_NAME + " version " + APP_VERSION);


var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
  console.log('Microservice ' + APP_NAME + 'running, Express is listening... at ' + PORT + " for /ping, /about and /tweet Enrichment API calls");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));
app.get('/about', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("About TweetEnricher API, Version " + APP_VERSION);
  res.write("Supported URLs:");
  res.write("/ping (GET)\n;");
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

app.post('/tweet', function (req, res) {
  // Get the key and value
  console.log('TweetEnricher - enrich tweet');
  console.log('body in request' + JSON.stringify(req.body));
  console.log("content type " + req.headers['content-type']);
  var tweet = req.body;
  var enrichedTweet = enrich(tweet);
  var responseBody = { "enrichedTweet": enrichedTweet };
  // Send the response
  res.setHeader('Content-Type', 'application/json');
  res.send(responseBody);

});

function enrich(tweet) {
  console.log("enrich tweet " + JSON.stringify(tweet));
  tweet.enrichment = "Lots of Money";
  tweet.extraEnrichment = "Even more loads of money, gold, diamonds and even some spiritual enrichment";
  return tweet;
}

// configure Kafka interaction
eventBusConsumer.registerEventHandler(workflowEventsTopic, handleWorkflowEvent);


function handleWorkflowEvent(eventMessage) {
  var event = JSON.parse(eventMessage.value);
  console.log("received message", eventMessage);
  console.log("actual event: " + JSON.stringify(event));

  // event we expect is of type workflowEvents
  // we should do something with this event if it contains an action (actions[].type='EnrichTweet' where status ="new" and conditions are satisfied)

  if (event.actions) {
    var acted = false;
    for (i = 0; i < event.actions.length; i++) {
      var action = event.actions[i];
      // find action of type EnrichTweet
      if (TweetEnricherActionType == action.type) {
        // check conditions
        if ("new" == action.status
          && conditionsSatisfied(action, event.actions)) {
          var workflowDocument;
          localCacheAPI.getFromCache(event.workflowConversationIdentifier, function (document) {
            console.log("Workflow document retrieved from cache");
            var workflowDocument = document;
            // this happens  asynchronously; right now we do not actually use the retrieved document. It does work.       
          });
          // if satisfied, then validate tweet
          var enrichedTweet = enrich(event.payload);
          event.payload = enrichedTweet;
          // update action in event
          action.status = 'complete';
          action.result = 'OK';
          // add audit line
          event.audit.push(
            { "when": new Date().getTime(), "who": "TweetEnricher", "what": "update", "comment": "Tweet Enrichment Performed" }
          );

          acted = true;
        }
      }// if EnrichTweet
      // if any action performed, then republish workflow event and store routingslip in cache
    }//for
    if (acted) {
      event.updateTimeStamp = new Date().getTime();
      event.lastUpdater = APP_NAME;
      // publish event
      eventBusPublisher.publishEvent('OracleCodeTwitterWorkflow' + event.updateTimeStamp,event, workflowEventsTopic);

      localLoggerAPI.log("Enriched Tweet  - (workflowConversationIdentifier:" + event.workflowConversationIdentifier + ")"
        , APP_NAME, "info");

      // PUT Workflow Document back  in Cache under workflow event identifier
      localCacheAPI.putInCache(event.workflowConversationIdentifier, event,
        function (result) {
          console.log("store workflowevent plus routing slip in cache under key " + event.workflowConversationIdentifier + ": " + JSON.stringify(result));
        });
    }// acted
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

