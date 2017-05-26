// before running, either globally install kafka-node  (npm install kafka-node)
// or add kafka-node to the dependencies of the local application

var kafka = require('kafka-node')
var Producer = kafka.Producer
var KAFKA_ZOOKEEPER_HOST = process.env.KAFKA_ZOOKEEPER_HOST || '192.168.99.100';
var KAFKA_ZOOKEEPER_PORT = process.env.KAFKA_ZOOKEEPER_PORT || '30686';

var KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'event-topic';
var version = 1.6;
console.log("KafkaProducer (version " + version + ") reporting for duty");
console.log("KAFKA_ZOOKEEPER_HOST: " + KAFKA_ZOOKEEPER_HOST);
console.log("KAFKA_ZOOKEEPER_PORT: " + KAFKA_ZOOKEEPER_PORT);
console.log("KAFKA_TOPIC: " + KAFKA_TOPIC);


var kafkaConnectDescriptor = KAFKA_ZOOKEEPER_HOST + ":" + KAFKA_ZOOKEEPER_PORT;
var eventBusTopic = KAFKA_TOPIC;

var client = new kafka.Client(kafkaConnectDescriptor)
var producer = new Producer(client);

var topics = [];

console.log("Try to retrieve list of topics:");
client.zk.client.getChildren("/brokers/topics", (err, children, stats) => {
    children.forEach(child => {console.log(child); topics.push(child)});
});

producer.on('ready', function () {
    console.log("producer  is ready");

    children.forEach(child => {
    KeyedMessage = kafka.KeyedMessage
    km = new KeyedMessage('key', 'message'),
        payloads = [
            { topic: child, messages: 'hi from Windows Host', partitions: 0 },
            { topic: child, messages: ['hi from node producer', 'one other message', km], partitions: 0 },
        ];

    producer.send(payloads, function (err, data) {
        console.log("send is complete " + data);
        console.log("error " + err);
    });

    producer.on('error', function (err) {
        console.error("Error " + err)
    })
    })//for each child
})