var kafka = require('kafka-node')
var Consumer = kafka.Consumer

var KAFKA_ZOOKEEPER_HOST = process.env.KAFKA_ZOOKEEPER_HOST;
var KAFKA_ZOOKEEPER_PORT = process.env.KAFKA_ZOOKEEPER_PORT;

var KAFKA_TOPIC = process.env.KAFKA_TOPIC;


var kafkaConnectDescriptor = KAFKA_ZOOKEEPER_HOST + ":" + KAFKA_ZOOKEEPER_PORT;
var eventBusTopic = KAFKA_TOPIC;
var client = new kafka.Client(kafkaConnectDescriptor)

var consumer = new Consumer(
  client,
  [],
  {fromOffset: true}
);

consumer.on('message', function (message) {
  console.log("received message", message);
  console.log("received message",JSON.stringify(message));
});

consumer.addTopics([
  { topic: eventBusTopic, partitions: 1, offset: 0}
], () => console.log("topic added"));