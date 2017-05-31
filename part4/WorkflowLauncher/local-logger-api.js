var request = require('request')
    ;
var kafka = require('kafka-node')

var localLoggerAPI = module.exports;
var moduleName = "accs.localLoggerAPI";
var kafkaHost = "ubuntu";
var kafkaHostIP = "192.168.188.101";
var Producer = kafka.Producer
KeyedMessage = kafka.KeyedMessage;

var logTopic = "logTopic";
var client;

localLoggerAPI.DEBUG = "debug";
localLoggerAPI.INFO = "info";
localLoggerAPI.WARN = "warning";
localLoggerAPI.ERROR = "error";

localLoggerAPI.log = function (message, moduleName, loglevel) {
    var logEntry = {
	"logLevel" : loglevel
	,"module" :  moduleName
	, "message" : message
}

    km = new KeyedMessage("logEntry", JSON.stringify(logEntry));

    payloads = [
      { topic: logTopic, messages: [km], partition: 0 }
    ];

    producer.send(payloads, function (err, data) {
        console.log("Published Log Entry :" + JSON.stringify(data));
    });

}//log

function initializeKafkaProducer(attempt) {
    try {
        console.log("Try to initialize Kafka Client and Producer in localLoggerAPI, attempt " + attempt);
        var client2 = new kafka.Client(kafkaHost + ":2181/")
        console.log("created client2");
        producer = new Producer(client2);
        console.log("submitted async producer creation request");
        producer.on('ready', function () {
            console.log("Producer is ready in " + APP_NAME);
        });
        producer.on('error', function (err) {
            console.log("failed to create the client or the producer " + JSON.stringify(err));
        })
    }
    catch (e) {
        console.log("Exception in initializeKafkaConsumer in localLoggerAPI: " + e);
        console.log("Exception in initializeKafkaConsumer" + JSON.stringify(e));
        console.log("Try again in 5 seconds");
        setTimeout(initializeKafkaProducer, 5000, ++attempt);
    }
}//initializeKafkaProducer

initializeKafkaProducer(1);


console.log("Local Logger API  initialized running against Kafka Topic " + logTopic);
