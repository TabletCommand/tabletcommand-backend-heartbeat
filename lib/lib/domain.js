"use strict";
module.exports = function domainModule() {
    var _ = require("lodash");
    function defaultMessage() {
        var receivedTime = new Date().valueOf() / 1000;
        return {
            Message: "",
            RcvTime: receivedTime,
            Status: "OK",
            Time: "" + receivedTime,
        };
    }
    function keyForHeartbeat(type, callback) {
        var keyPrefix = "hb:x";
        var resolved = false;
        if (type === "incident") {
            keyPrefix = "hb:i";
            resolved = true;
        }
        else if (type === "status") {
            keyPrefix = "hb:s";
            resolved = true;
        }
        else if (type === "location") {
            keyPrefix = "hb:l";
            resolved = true;
        }
        return callback(keyPrefix, resolved);
    }
    function keyForDepartment(department, prefix, callback) {
        var departmentId = "unknown";
        var resolved = false;
        if (_.isString(department.id)) {
            departmentId = department.id;
            resolved = true;
        }
        else if (_.isString(department._id)) {
            departmentId = department._id;
            resolved = true;
        }
        var key = prefix + ":" + departmentId;
        return callback(key, resolved);
    }
    function interfaceVersionKey(department, callback) {
        return keyForDepartment(department, "cad:v", callback);
    }
    function interfaceVersionFromMessage(message, callback) {
        return callback("", true);
    }
    function heartbeatKeyForTypeOfDepartment(type, department, callback) {
        return keyForHeartbeat(type, function (keyPrefix) {
            return keyForDepartment(department, keyPrefix, callback);
        });
    }
    function heartbeatFromMessage(message, callback) {
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
        return callback(msg, true);
    }
    return {
        defaultMessage: defaultMessage,
        heartbeatFromMessage: heartbeatFromMessage,
        heartbeatKeyForTypeOfDepartment: heartbeatKeyForTypeOfDepartment,
        interfaceVersionFromMessage: interfaceVersionFromMessage,
        interfaceVersionKey: interfaceVersionKey,
        keyForDepartment: keyForDepartment,
        keyForHeartbeat: keyForHeartbeat,
    };
};
