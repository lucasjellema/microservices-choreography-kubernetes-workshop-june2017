var kafka = require('kafka-node');

var kafkaHost = process.env.KAFKA_HOST || "ubuntu";
var zookeeperPort = process.env.ZOOKEEPER_PORT || 2181;
var Producer = kafka.Producer
KeyedMessage = kafka.KeyedMessage;
var Consumer = kafka.Consumer
var consumer;

var client;

var APP_VERSION = "0.1.3"
var APP_NAME = "EventBusConsumer"


console.log("Initialized module " + APP_NAME + "version " + APP_VERSION);


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
  }
  catch (err) {
    console.log("Exception in initializeKafkaConsumer" + e);
    console.log("Exception in initializeKafkaConsumer" + JSON.stringify(e));
    console.log("Try again in 5 seconds");
    setTimeout(initializeKafkaConsumer, 5000, attempt + 1);
  }
}//initializeKafkaConsumer

initializeKafkaConsumer(1);


var eventConsumer = module.exports;


eventConsumer.registerEventHandler = function ( topic, handler) {
    consumer.on('message', handler);
    consumer.on('error', function (err) {
      console.log("error in creation of Kafka consumer " + JSON.stringify(err));
      console.log("Try again in 5 seconds");
      setTimeout(initializeKafkaConsumer, 5000, attempt + 1);
    });
    consumer.addTopics([
      { topic:topic, partition: 0, offset: 0 }
    ], () => console.log("topic added: " + topic));
    console.log("Kafka Consumer - added message handler and added topic");

}
