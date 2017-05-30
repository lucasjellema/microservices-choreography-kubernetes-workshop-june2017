var kafka = require('kafka-node')
var http = require('http'),
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser');

var kafkaHost = process.env.KAFKA_HOST || "ubuntu";
var zookeeperPort = process.env.ZOOKEEPER_PORT || 2181;
//var kafkaHostIP = "192.168.188.101";
var Consumer = kafka.Consumer
var Producer = kafka.Producer
KeyedMessage = kafka.KeyedMessage;

var kafkaTopic = process.env.KAFKA_TOPIC || "event-bus";
var client;
var consumer;
var PORT = process.env.APP_PORT || 8096;
var APP_VERSION = "0.8"
var APP_NAME = "EventBusListener"


console.log("Running " + APP_NAME + "version " + APP_VERSION);


var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
  console.log('Microservice' + APP_NAME + ' running, Express is listening... at ' + PORT + " for /ping, /about and /event-bus calls");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));
app.get('/about', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("About EventBusListener, Version " + APP_VERSION);
  res.write("Supported URLs:");
  res.write("/ping (GET)\n;");
  res.write("/event-bus (GET)");
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

app.get('/event-bus', function (req, res) {
  var document = { "topic": kafkaTopic , "events": events};
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(document));
});

var events = [];


function initializeKafkaConsumer(attempt) {
  try {
    console.log("Try to initialize Kafka Client and Consumer, attempt " + attempt);
    var client = new kafka.Client(kafkaHost + ":"+zookeeperPort+"/")
    console.log("created client for " + kafkaHost);
    consumer = new Consumer(
      client,
      [],
      { fromOffset: true }
    );
    console.log("Kafka Client and Consumer initialized " + consumer);
    // register the handler for any messages received by the consumer on any topic it is listening to. 
    consumer.on('message', function (message) {
      console.log("event received");
      handleEventBusMessage(message);
    });
    consumer.on('error', function (err) {
      console.log("error in creation of Kafka consumer " + JSON.stringify(err));
      console.log("Try again in 5 seconds");
      setTimeout(initializeKafkaConsumer, 5000, attempt + 1);
    });
    consumer.addTopics([
      { topic: kafkaTopic, partition: 0, offset: 0 }
    ], () => console.log("topic added: " + kafkaTopic));
    console.log("Kafka Consumer - added message handler and added topic");
  }
  catch (err) {
    console.log("Exception in initializeKafkaConsumer" + e);
    console.log("Exception in initializeKafkaConsumer" + JSON.stringify(e));
    console.log("Try again in 5 seconds");
    setTimeout(initializeKafkaConsumer, 5000, attempt + 1);
  }
}//initializeKafkaConsumer

initializeKafkaConsumer(1);
//initializeKafkaProducer(1);

function handleEventBusMessage(eventMessage) {
  try {
    var event = JSON.parse(eventMessage.value);
    console.log("received message", eventMessage);
    console.log("received message object", JSON.stringify(eventMessage));
    console.log("actual event: " + JSON.stringify(event));
    events.push(event);
  } catch (e) {
    console.error("Exception " + e + "in handling event " + eventMessage.value);
  }
}// handleEventBusMessage
