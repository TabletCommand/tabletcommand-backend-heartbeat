"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function module(dependencies) {
    var client = dependencies.redisClient;
    var _ = require("lodash");
    var moment = require("moment-timezone");
    var domain = require("./lib/domain")();
    var store = require("./lib/store")({
        client: client,
    });
    function log(department, message, type, callback) {
        if (!_.isObject(department)) {
            return callback(null);
        }
        return domain.heartbeatKeyForTypeOfDepartment(type, department, function (key) {
            // Log Heartbeat cannot expire keys, because we'd lose the last message
            // we're limiting the list to maxListSize items instead
            return domain.heartbeatFromMessage(message, function (msg) {
                return store.storeHeartbeat(key, msg, function (err) {
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
            return domain.interfaceVersionForDepartment(department, message, function (interfaceVersion, key, resolved) {
                if (!resolved) {
                    return callback(null);
                }
                return store.storeInterfaceVersion(key, interfaceVersion, callback);
            });
        });
    }
    function configureOpts() {
        moment.updateLocale("en", {
            // tslint:disable:object-literal-sort-keys
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "%ds",
                ss: "%ds",
                m: "%dmin",
                mm: "%dmin",
                h: "%dh",
                hh: "%dh",
                d: "%dd",
                dd: "%dd",
                M: "%dmon",
                MM: "%dmon",
                y: "%dy",
                yy: "%dy",
            },
        });
    }
    function heartbeatItems(department, type, callback) {
        return domain.heartbeatKeyForTypeOfDepartment(type, department, function (key) {
            configureOpts();
            return store.getHeartbeats(key, function (err, decodedItems) {
                var enhancedResults = _.map(decodedItems, function (item) {
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
            return store.getInterfaceVersion(key, callback);
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
        logInterfaceVersion: logInterfaceVersion,
    };
};
