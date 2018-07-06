"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function module(dependencies) {
    var redis = dependencies.redis;
    var client = dependencies.redisClient;
    var _ = require("lodash");
    var moment = require("moment-timezone");
    var helpers = require("tabletcommand-middleware").helpers;
    var maxListSize = 30;
    function configure(config) {
        return redis.createClient(config);
    }
    function keyForHeartbeat(type, callback) {
        var keyPrefix = "hb:x";
        if (type === "incident") {
            keyPrefix = "hb:i";
        }
        else if (type === "status") {
            keyPrefix = "hb:s";
        }
        else if (type === "location") {
            keyPrefix = "hb:l";
        }
        return callback(keyPrefix);
    }
    function keyForDepartment(department, prefix, callback) {
        var departmentId = "unknown";
        if (_.isString(department.id)) {
            departmentId = department.id;
        }
        else if (_.isString(department._id)) {
            departmentId = department._id;
        }
        var key = prefix + ":" + departmentId;
        return callback(key);
    }
    function cleanupMessage(message, callback) {
        if (!_.isString(message.Time)) {
            // If no .Time provided, peek into .Unit
            if (_.isArray(message.Unit)) {
                var unitTime = null;
                _.each(message.Unit, function (unit) {
                    if (_.isString(unit.TimeArrived)) {
                        unitTime = unit.TimeArrived;
                    }
                    else if (_.isString(unit.TimeEnroute)) {
                        unitTime = unit.TimeEnroute;
                    }
                    else if (_.isString(unit.TimeDispatched)) {
                        unitTime = unit.TimeDispatched;
                    }
                });
                if (!_.isNull(unitTime) && !_.isUndefined(unitTime)) {
                    message.Time = unitTime;
                }
            }
            else if (_.isString(message.EntryDateTime)) {
                message.Time = message.EntryDateTime;
            }
        }
        var msg = _.pick(message, ["Time", "Status", "Message"]);
        msg.RcvTime = new Date().getTime() / 1000.0;
        return callback(msg);
    }
    ;
    function log(department, message, type, callback) {
        if (!_.isObject(department)) {
            console.log("Undefined department", department);
            return callback(null);
        }
        if (!helpers.itemIsTrue(department, "heartbeatEnabled")) {
            return callback(null);
        }
        return keyForHeartbeat(type, function (keyPrefix) {
            // Log Heartbeat cannot expire keys, because we'd lose the last message
            // we're limiting the list to maxListSize items instead
            return keyForDepartment(department, keyPrefix, function (key) {
                return cleanupMessage(message, function (msg) {
                    return client.lpush(key, JSON.stringify(msg), function (err, result) {
                        if (err) {
                            return callback(err);
                        }
                        return client.ltrim(key, 0, maxListSize - 1, function (err, result) {
                            return callback(err);
                        });
                    });
                });
            });
        });
    }
    function heartbeatItems(department, type, callback) {
        return keyForHeartbeat(type, function (keyPrefix) {
            return keyForDepartment(department, keyPrefix, function (key) {
                helpers.configureMomentOpts();
                return client.lrange(key, 0, maxListSize, function (err, result) {
                    var enhancedResults = _.map(result, function (i) {
                        var item = JSON.parse(i);
                        item.RcvTimeSFO = moment.unix(item.RcvTime).tz("America/Los_Angeles").toString();
                        item.RcvTimeMEL = moment.unix(item.RcvTime).tz("Australia/Melbourne").toString();
                        item.timeAgo = moment(item.RcvTime * 1000).fromNow();
                        return item;
                    });
                    return callback(err, enhancedResults);
                });
            });
        });
    }
    function check(department, callback) {
        if (!_.isObject(department.heartbeat)) {
            department.heartbeat = {
                incident: [],
                status: [],
                location: []
            };
        }
        return heartbeatItems(department, "incident", function (err, items) {
            if (err) {
                return callback(err, department);
            }
            department.heartbeat.incident = items;
            return heartbeatItems(department, "status", function (err, items) {
                if (err) {
                    return callback(err, department);
                }
                department.heartbeat.status = items;
                return heartbeatItems(department, "location", function (err, items) {
                    department.heartbeat.location = items;
                    return callback(err, department);
                });
            });
        });
    }
    return {
        configure: configure,
        log: log,
        check: check
    };
};
