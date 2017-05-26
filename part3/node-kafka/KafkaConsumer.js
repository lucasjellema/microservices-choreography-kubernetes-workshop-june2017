var kafka = require('kafka-node')
var Consumer = kafka.Consumer

var KAFKA_ZOOKEEPER_HOST = process.env.KAFKA_ZOOKEEPER_HOST;
var KAFKA_ZOOKEEPER_PORT = process.env.KAFKA_ZOOKEEPER_PORT;

var KAFKA_TOPIC = process.env.KAFKA_TOPIC;

console.log("KafkaConsumer reporting for duty");
console.log("KAFKA_ZOOKEEPER_HOST: " + KAFKA_ZOOKEEPER_HOST);
console.log("KAFKA_ZOOKEEPER_PORT: " + KAFKA_ZOOKEEPER_PORT);
console.log("KAFKA_TOPIC: " + KAFKA_TOPIC);


var kafkaConnectDescriptor = KAFKA_ZOOKEEPER_HOST + ":" + KAFKA_ZOOKEEPER_PORT;
var eventBusTopic = KAFKA_TOPIC;
console.log('Creating Client');
var client = new kafka.Client(kafkaConnectDescriptor)

var consumer = new Consumer(
  client,
  [],
  { fromOffset: true }
);

consumer.on('message', function (message) {
  console.log("received message", message);
  console.log("received message", JSON.stringify(message));
});

console.log("Going to add topic " + eventBusTopic);
consumer.addTopics([
  { topic: eventBusTopic, partitions: 1, offset: 0 }
], () => console.log("topic " + eventBusTopic + " added"));