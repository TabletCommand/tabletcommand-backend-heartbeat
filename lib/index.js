"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function module(dependencies) {
    var client = dependencies.redisClient;
    var _ = require("lodash");
    var moment = require("moment-timezone");
    var helpers = require("tabletcommand-middleware").helpers;
    var maxListSize = 30;
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
                var unitTime_1 = null;
                _.each(message.Unit, function (unit) {
                    if (_.isString(unit.TimeArrived)) {
                        unitTime_1 = unit.TimeArrived;
                    }
                    else if (_.isString(unit.TimeEnroute)) {
                        unitTime_1 = unit.TimeEnroute;
                    }
                    else if (_.isString(unit.TimeDispatched)) {
                        unitTime_1 = unit.TimeDispatched;
                    }
                });
                if (!_.isNull(unitTime_1) && !_.isUndefined(unitTime_1)) {
                    message.Time = unitTime_1;
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
    function log(department, message, type, callback) {
        if (!_.isObject(department)) {
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
                    return client.lpush(key, JSON.stringify(msg), function (lpushErr) {
                        if (lpushErr) {
                            return callback(lpushErr);
                        }
                        return client.ltrim(key, 0, maxListSize - 1, function (ltrimErr) {
                            return callback(ltrimErr);
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
    function checkDepartment(department, callback) {
        if (!_.isObject(department.heartbeat)) {
            department.heartbeat = {
                incident: [],
                location: [],
                status: [],
            };
        }
        return heartbeatItems(department, "incident", function (errIncident, incident) {
            if (errIncident) {
                return callback(errIncident, department);
            }
            department.heartbeat.incident = incident;
            return heartbeatItems(department, "status", function (errStatus, status) {
                if (errStatus) {
                    return callback(errStatus, department);
                }
                department.heartbeat.status = status;
                return heartbeatItems(department, "location", function (errLocation, location) {
                    department.heartbeat.location = location;
                    return callback(errLocation, department);
                });
            });
        });
    }
    function checkDepartments(items, callback) {
        return checkHeartbeats(items, 0, [], callback);
    }
    function checkHeartbeats(items, index, storage, callback) {
        if (index >= _.size(items)) {
            return callback(null, storage);
        }
        var department = items[index];
        return checkDepartment(department, function (err, dept) {
            if (err) {
                return callback(err, []);
            }
            storage.push(dept);
            return checkHeartbeats(items, index + 1, storage, callback);
        });
    }
    function defaultMessage() {
        var receivedTime = new Date().valueOf() / 1000;
        return {
            Message: "",
            RcvTime: receivedTime,
            Status: "OK",
            Time: "" + receivedTime,
        };
    }
    return {
        checkDepartment: checkDepartment,
        checkDepartments: checkDepartments,
        defaultMessage: defaultMessage,
        log: log,
    };
};
