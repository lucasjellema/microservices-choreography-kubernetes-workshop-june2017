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
var PORT = process.env.APP_PORT || 8095;
var APP_VERSION = "0.8.3"
var APP_NAME = "EventBusPublisher"


console.log("Running " + APP_NAME + "version " + APP_VERSION);


var app = express();
var server = http.createServer(app);
server.listen(PORT, function () {
  console.log('Microservice' + APP_NAME + ' running, Express is listening... at ' + PORT + " for /ping, /about and /publish calls");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));
app.get('/about', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("About " + APP_NAME + ", Version " + APP_VERSION);
  res.write("Supported URLs:");
  res.write("/ping (GET)\n;");
  res.write("/publish?field1=value&field2=value_2 (GET)");
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

var events = [];

function initializeKafkaProducer(attempt) {
  try {
    console.log("Try to initialize Kafka Client and Producer, attempt " + attempt);
    var client = new kafka.Client(kafkaHost + ":" + zookeeperPort + "/")
    console.log("created client");
    producer = new Producer(client);
    console.log("submitted async producer creation request");
    producer.on('ready', function () {
      console.log("Producer is ready in " + APP_NAME);
    });
    producer.on('error', function (err) {
      console.log("failed to create the client or the producer " + JSON.stringify(err));
    })
  }
  catch (e) {
    console.log("Exception in initializeKafkaProducer" + e);
    console.log("Exception in initializeKafkaProducer" + JSON.stringify(e));
    console.log("Try again in 5 seconds");
    setTimeout(initializeKafkaProducer, 5000, ++attempt);
  }
}//initializeKafkaProducer
initializeKafkaProducer(1);

function publishEvent(event) {
  km = new KeyedMessage('EventBusEvent', JSON.stringify(event));
  payloads = [
    { topic: kafkaTopic, messages: [km], partition: 0 }
  ];
  producer.send(payloads, function (err, data) {
    console.log("Published event to topic " + kafkaTopic + " :" + JSON.stringify(data));
  });

}