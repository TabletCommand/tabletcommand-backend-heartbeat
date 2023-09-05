"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var moment_timezone_1 = __importDefault(require("moment-timezone"));
function domain() {
    var defaultDelay = -7200; // Invalid value, 2h
    function defaultMessage() {
        var receivedTime = new Date().valueOf() / 1000;
        return {
            Message: "",
            RcvTime: receivedTime,
            Status: "OK",
            Time: "".concat(receivedTime),
            Delay: defaultDelay,
            H: -1,
        };
    }
    function keyForHeartbeat(type) {
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
        return {
            keyPrefix: keyPrefix,
            resolved: resolved
        };
    }
    function keyForDepartment(department, prefix) {
        var departmentId = "unknown";
        var resolved = false;
        if (department.id && lodash_1.default.isString(department.id)) {
            departmentId = department.id;
            resolved = true;
        }
        else if (department._id && lodash_1.default.isString(department._id)) {
            departmentId = department._id;
            resolved = true;
        }
        var key = "".concat(prefix, ":").concat(departmentId);
        return {
            key: key,
            resolved: resolved,
        };
    }
    function interfaceVersionKey(department) {
        var result = keyForDepartment(department, "cad:v");
        return result;
    }
    function extractVersion(text, defaultVersion) {
        if (lodash_1.default.trim(text) === "") {
            return {
                version: defaultVersion,
                resolved: false,
            };
        }
        var cleanup = [
            /JSON.message.by/,
            /Simple-Track/,
            /Tablet.Command.Inc/,
            /Tablet.Command/g,
            /Comment$/,
            /Incident$/,
            /Units$/,
            /Units$/,
            /Incident.Complete$/,
        ];
        var clean = text;
        cleanup.forEach(function (regex) {
            clean = clean.replace(regex, "");
        });
        var parts = clean.split(" ");
        var removed = parts.filter(function (item) {
            var trimmed = lodash_1.default.trim(item);
            return trimmed !== "" && trimmed !== "-";
        });
        return {
            version: removed.join(" "),
            resolved: true,
        };
    }
    function interfaceVersionFromMessage(message) {
        var defaultVersion = "Unknown";
        if (!lodash_1.default.isObject(message)) {
            return {
                resolved: false,
                version: defaultVersion,
            };
        }
        var msgInterface = "";
        if (lodash_1.default.isString(message.Interface)) {
            msgInterface = message.Interface;
        }
        return extractVersion(msgInterface, defaultVersion);
    }
    function interfaceVersionForDepartment(department, message) {
        var key = interfaceVersionKey(department).key;
        var _a = interfaceVersionFromMessage(message), interfaceVersion = _a.version, resolved = _a.resolved;
        return {
            version: interfaceVersion,
            key: key,
            resolved: resolved
        };
    }
    function shouldLogInterfaceVersion(type) {
        return lodash_1.default.isString(type) && (type === "incident");
    }
    function heartbeatKeyForTypeOfDepartment(type, department) {
        var keyPrefix = keyForHeartbeat(type).keyPrefix;
        return keyForDepartment(department, keyPrefix);
    }
    function calculateDelay(message, atDate, fallback) {
        var delay = fallback;
        var isHeartBeat = false;
        var unitKeys = [
            "TimeArrived",
            "TimeAtHospital",
            "TimeCleared",
            "TimeDispatched",
            "TimeEnroute",
            "TimePatient",
            "TimeStaged",
            "TimeTransport",
            "TimeTransporting",
        ];
        var t = "";
        if (lodash_1.default.isObject(message)) {
            // Process heartbeat
            if (lodash_1.default.isString(message.Time) && message.Time !== "" && !lodash_1.default.isString(message.IncidentNumber)) {
                isHeartBeat = true;
                t = message.Time;
            }
            else {
                var candidate_1 = new Date(0);
                // Process incident dates
                if (lodash_1.default.isString(message.EntryDateTime) && message.EntryDateTime !== "" && (0, moment_timezone_1.default)(message.EntryDateTime, true).isValid()) {
                    candidate_1 = new Date(Math.max(candidate_1.valueOf(), (0, moment_timezone_1.default)(message.EntryDateTime, true).valueOf()));
                }
                if (lodash_1.default.isString(message.ClosedDateTime) && message.ClosedDateTime !== "" && (0, moment_timezone_1.default)(message.ClosedDateTime, true).isValid()) {
                    candidate_1 = new Date(Math.max(candidate_1.valueOf(), (0, moment_timezone_1.default)(message.ClosedDateTime, true).valueOf()));
                }
                // Extract from Unit
                if (lodash_1.default.isArray(message.Unit)) {
                    message.Unit.forEach(function (u) {
                        if (!lodash_1.default.isObject(u)) {
                            return;
                        }
                        for (var _i = 0, unitKeys_1 = unitKeys; _i < unitKeys_1.length; _i++) {
                            var timeKey = unitKeys_1[_i];
                            var maybeUnitTime = u[timeKey];
                            if (lodash_1.default.isString(maybeUnitTime) && maybeUnitTime != "" && (0, moment_timezone_1.default)(maybeUnitTime, true).isValid()) {
                                candidate_1 = new Date(Math.max(candidate_1.valueOf(), (0, moment_timezone_1.default)(maybeUnitTime, true).valueOf()));
                            }
                        }
                    });
                }
                // Extract from Comment
                if (lodash_1.default.isArray(message.Comment)) {
                    message.Comment.forEach(function (c) {
                        if (!lodash_1.default.isObject(c)) {
                            return;
                        }
                        if (lodash_1.default.isString(c.CommentDateTime) && c.CommentDateTime !== "" && (0, moment_timezone_1.default)(c.CommentDateTime, true).isValid()) {
                            candidate_1 = new Date(Math.max(candidate_1.valueOf(), (0, moment_timezone_1.default)(c.CommentDateTime, true).valueOf()));
                        }
                    });
                }
                t = candidate_1.toISOString();
            }
        }
        if ((0, moment_timezone_1.default)(t, true).isValid()) {
            var provided = (0, moment_timezone_1.default)(t, true); // Strict
            var current = (0, moment_timezone_1.default)(atDate);
            delay = moment_timezone_1.default.duration(current.diff(provided)).as("seconds");
        }
        return {
            delay: delay,
            isHeartBeat: isHeartBeat,
        };
    }
    function heartbeatFromMessage(message, atDate) {
        if (!lodash_1.default.isString(message.Time)) {
            // If no .Time provided, peek into .Unit
            if (lodash_1.default.isArray(message.Unit)) {
                var unitTime_1 = null;
                lodash_1.default.each(message.Unit, function (unit) {
                    if (lodash_1.default.isString(unit.TimeArrived)) {
                        unitTime_1 = unit.TimeArrived;
                    }
                    else if (lodash_1.default.isString(unit.TimeEnroute)) {
                        unitTime_1 = unit.TimeEnroute;
                    }
                    else if (lodash_1.default.isString(unit.TimeDispatched)) {
                        unitTime_1 = unit.TimeDispatched;
                    }
                });
                if (!lodash_1.default.isNull(unitTime_1) && !lodash_1.default.isUndefined(unitTime_1)) {
                    message.Time = unitTime_1;
                }
            }
            else if (lodash_1.default.isString(message.EntryDateTime)) {
                message.Time = message.EntryDateTime;
            }
        }
        var _a = calculateDelay(message, atDate, defaultDelay), delay = _a.delay, isHeartBeat = _a.isHeartBeat;
        var msg = lodash_1.default.pick(message, ["Time", "Status", "Message", "RcvTime", "Delay", "H"]);
        msg.RcvTime = atDate.valueOf() / 1000.0;
        msg.Delay = delay;
        msg.H = isHeartBeat ? 1 : 0;
        return msg;
    }
    return {
        shouldLogInterfaceVersion: shouldLogInterfaceVersion,
        defaultMessage: defaultMessage,
        extractVersion: extractVersion,
        heartbeatFromMessage: heartbeatFromMessage,
        heartbeatKeyForTypeOfDepartment: heartbeatKeyForTypeOfDepartment,
        interfaceVersionForDepartment: interfaceVersionForDepartment,
        interfaceVersionFromMessage: interfaceVersionFromMessage,
        interfaceVersionKey: interfaceVersionKey,
        keyForDepartment: keyForDepartment,
        keyForHeartbeat: keyForHeartbeat,
        defaultDelay: defaultDelay,
        calculateDelay: calculateDelay,
    };
}
exports.default = domain;
//# sourceMappingURL=domain.js.map