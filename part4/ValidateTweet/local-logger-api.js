var eventBusPublisher = require("./EventPublisher.js");

var localLoggerAPI = module.exports;
var moduleName = "accs.localLoggerAPI";

var logTopic = "logTopic";

localLoggerAPI.DEBUG = "debug";
localLoggerAPI.INFO = "info";
localLoggerAPI.WARN = "warning";
localLoggerAPI.ERROR = "error";

localLoggerAPI.log = function (message, moduleName, loglevel) {
    var logEntry = {
        "logLevel": loglevel
        , "module": moduleName
        , "message": message
    }
    try {
    eventBusPublisher.publishEvent("logEntry", JSON.stringify(logEntry), logTopic);
    } catch (e) {}
}//log


console.log("Local Logger API  initialized running against Kafka Topic " + logTopic);
