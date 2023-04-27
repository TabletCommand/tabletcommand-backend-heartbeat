"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
function domain() {
    function defaultMessage() {
        var receivedTime = new Date().valueOf() / 1000;
        return {
            Message: "",
            RcvTime: receivedTime,
            Status: "OK",
            Time: "".concat(receivedTime),
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
    function heartbeatFromMessage(message) {
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
        var msg = lodash_1.default.pick(message, ["Time", "Status", "Message", "RcvTime"]);
        msg.RcvTime = new Date().getTime() / 1000.0;
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
    };
}
exports.default = domain;
//# sourceMappingURL=domain.js.map