"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function module(dependencies) {
    var client = dependencies.redisClient;
    var _ = require("lodash");
    var moment = require("moment-timezone");
    var helpers = require("tabletcommand-middleware").helpers;
    var domain = require("./lib/domain")();
    var maxListSize = 30;
    function log(department, message, type, callback) {
        if (!_.isObject(department)) {
            return callback(null);
        }
        return domain.heartbeatKeyForTypeOfDepartment(type, department, function (key) {
            // Log Heartbeat cannot expire keys, because we'd lose the last message
            // we're limiting the list to maxListSize items instead
            return domain.heartbeatFromMessage(message, function (msg) {
                return storeHeartbeat(key, msg, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return logInterfaceVersion(department, message, type, callback);
                });
            });
        });
    }
    function logInterfaceVersion(department, message, type, callback) {
        return domain.canLogInterfaceVersion(type, function (canLog) {
            if (!canLog) {
                return callback(null);
            }
            return domain.interfaceVersionForDepartment(department, message, function (interfaceVersion, key) {
                return storeInterfaceVersion(key, interfaceVersion, callback);
            });
        });
    }
    function storeInterfaceVersion(key, version, callback) {
        return client.set(key, version, callback);
    }
    function storeHeartbeat(key, msg, callback) {
        return client.lpush(key, JSON.stringify(msg), function (lpushErr) {
            if (lpushErr) {
                return callback(lpushErr);
            }
            return client.ltrim(key, 0, maxListSize - 1, function (ltrimErr) {
                return callback(ltrimErr);
            });
        });
    }
    function heartbeatItems(department, type, callback) {
        return domain.heartbeatKeyForTypeOfDepartment(type, department, function (key) {
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
    }
    function getInterfaceVersion(department, callback) {
        return domain.interfaceVersionKey(department, function (key) {
            return client.get(key, function (err, result) {
                var version = "";
                if (_.isString(result)) {
                    version = result;
                }
                return callback(err, version);
            });
        });
    }
    function checkDepartment(department, callback) {
        if (!_.isObject(department.heartbeat)) {
            department.heartbeat = {
                incident: [],
                location: [],
                status: [],
                version: "",
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
                    if (errLocation) {
                        return callback(errLocation, department);
                    }
                    department.heartbeat.location = location;
                    return getInterfaceVersion(department, function (errVersion, version) {
                        department.heartbeat.version = version;
                        return callback(errVersion, department);
                    });
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
    return {
        checkDepartment: checkDepartment,
        checkDepartments: checkDepartments,
        defaultMessage: domain.defaultMessage,
        log: log,
    };
};
