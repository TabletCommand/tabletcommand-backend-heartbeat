"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var moment_timezone_1 = __importDefault(require("moment-timezone"));
function domain() {
    var debug = (0, debug_1.default)("heartbeat:lib:domain");
    var defaultDelay = -7200; // Invalid value, 2h in the future
    function defaultMessage(atDate) {
        if (atDate === void 0) { atDate = new Date(); }
        return {
            Message: "OK",
            Status: "OK",
            Time: atDate.toISOString(),
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
        if (lodash_1.default.isString(message === null || message === void 0 ? void 0 : message.Interface)) {
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
        var _a, _b;
        var delay = fallback;
        var isHeartBeat = false;
        debug("calculateDelay message: ".concat(JSON.stringify(message), " atDate: ").concat(atDate.toISOString(), " fallback: ").concat(fallback));
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
        var current = (0, moment_timezone_1.default)(atDate);
        var minDate = current.clone().subtract(48, "hours");
        var src = "?";
        var t = "";
        var valid = false;
        if (lodash_1.default.isObject(message)) {
            // Process heartbeat
            if ("Time" in message && lodash_1.default.isString(message.Time) && message.Time !== "" && !("IncidentNumber" in message)) {
                isHeartBeat = true;
                t = message.Time;
                src = "hb";
            }
            else if ("IncidentNumber" in message && lodash_1.default.isString(message.IncidentNumber) && message.IncidentNumber.trim() !== "") {
                var candidate_1 = (0, moment_timezone_1.default)(0); // Start with an older date
                var incidentNumber_1 = (_a = message.IncidentNumber) !== null && _a !== void 0 ? _a : "X";
                // Process incident dates
                if (lodash_1.default.isString(message.EntryDateTime) && message.EntryDateTime !== "") {
                    var mEntryDate = (0, moment_timezone_1.default)(message.EntryDateTime, true);
                    if (mEntryDate.isValid() && candidate_1.isBefore(mEntryDate)) {
                        candidate_1 = mEntryDate;
                        src = "".concat(incidentNumber_1, "-entry");
                    }
                }
                if (lodash_1.default.isString(message.ClosedDateTime) && message.ClosedDateTime !== "") {
                    var mClosedDate = (0, moment_timezone_1.default)(message.ClosedDateTime, true);
                    if (mClosedDate.isValid() && candidate_1.isBefore(mClosedDate)) {
                        candidate_1 = mClosedDate;
                        src = "".concat(incidentNumber_1, "-closed");
                    }
                }
                // Extract from Unit
                if (lodash_1.default.isArray(message.Unit)) {
                    (_b = message.Unit) === null || _b === void 0 ? void 0 : _b.forEach(function (u) {
                        var _a;
                        if (!lodash_1.default.isObject(u)) {
                            return;
                        }
                        for (var _i = 0, unitKeys_1 = unitKeys; _i < unitKeys_1.length; _i++) {
                            var timeKey = unitKeys_1[_i];
                            var maybeUnitTime = u[timeKey];
                            if (lodash_1.default.isString(maybeUnitTime) && maybeUnitTime != "") {
                                var mUnitTime = (0, moment_timezone_1.default)(maybeUnitTime, true);
                                if (mUnitTime.isValid() && candidate_1.isBefore(mUnitTime)) {
                                    candidate_1 = mUnitTime;
                                    src = "".concat(incidentNumber_1, "-").concat((_a = u.UnitID) !== null && _a !== void 0 ? _a : "X", "-").concat(timeKey);
                                }
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
                        if (lodash_1.default.isString(c.CommentDateTime) && c.CommentDateTime !== "") {
                            var mCommentDate = (0, moment_timezone_1.default)(c.CommentDateTime, true);
                            if (mCommentDate.isValid() && candidate_1.isBefore(mCommentDate)) {
                                candidate_1 = mCommentDate;
                                src = "".concat(incidentNumber_1, "-commentDate");
                            }
                        }
                    });
                }
                if (candidate_1.isAfter(minDate)) {
                    t = candidate_1.toISOString();
                }
            }
        }
        if (t !== "" && (0, moment_timezone_1.default)(t, true).isValid()) {
            var provided = (0, moment_timezone_1.default)(t, true); // Strict
            delay = moment_timezone_1.default.duration(current.diff(provided)).as("seconds");
            valid = true;
        }
        debug("calculateDelay isHeartBeat:".concat(isHeartBeat, " t:").concat(t, " at:").concat(atDate.toISOString(), " delay:").concat(delay, " src: ").concat(src, "."));
        return {
            delay: delay,
            isHeartBeat: isHeartBeat,
            src: src,
            valid: valid,
        };
    }
    function heartbeatFromMessage(message, atDate) {
        var _a = calculateDelay(message, atDate, defaultDelay), delay = _a.delay, isHeartBeat = _a.isHeartBeat, src = _a.src, valid = _a.valid;
        var msg = {
            Delay: delay,
            H: isHeartBeat ? 1 : 0,
            RcvTime: atDate.valueOf() / 1000.0,
            src: src,
            v: valid,
        };
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