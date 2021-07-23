"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var domain_1 = __importDefault(require("./lib/domain"));
var store_1 = __importDefault(require("./lib/store"));
module.exports = function module(dependencies) {
    var client = dependencies.redisClient;
    var domain = domain_1.default();
    var store = store_1.default({
        client: client,
    });
    function log(department, message, type, callback) {
        var _this = this;
        if (!lodash_1.default.isObject(department)) {
            return callback(null);
        }
        var _a = domain.heartbeatKeyForTypeOfDepartment(type, department), key = _a.key, resolved = _a.resolved;
        // Log Heartbeat cannot expire keys, because we'd lose the last message
        // we're limiting the list to maxListSize items instead
        var msg = domain.heartbeatFromMessage(message);
        return store.storeHeartbeat(key, msg, function (err) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err) {
                            return [2 /*return*/, callback(err)];
                        }
                        return [4 /*yield*/, logInterfaceVersion(department, message, type)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, callback(null)];
                }
            });
        }); });
    }
    function logInterfaceVersion(department, message, type) {
        return __awaiter(this, void 0, void 0, function () {
            var canLog, _a, interfaceVersion, key, resolved;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        canLog = domain.canLogInterfaceVersion(type);
                        if (!canLog) {
                            return [2 /*return*/];
                        }
                        _a = domain.interfaceVersionForDepartment(department, message), interfaceVersion = _a.version, key = _a.key, resolved = _a.resolved;
                        if (!resolved) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, store.storeInterfaceVersion(key, interfaceVersion)];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    }
    function configureOpts() {
        moment_timezone_1.default.updateLocale("en", {
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
            // tslint:enable:object-literal-sort-keys
        });
    }
    function heartbeatItems(department, type, callback) {
        var key = domain.heartbeatKeyForTypeOfDepartment(type, department).key;
        configureOpts();
        return store.getHeartbeats(key, function (err, decodedItems) {
            var enhancedResults = lodash_1.default.map(decodedItems, function (item) {
                item.RcvTimeSFO = moment_timezone_1.default.unix(item.RcvTime).tz("America/Los_Angeles").toString();
                item.RcvTimeMEL = moment_timezone_1.default.unix(item.RcvTime).tz("Australia/Melbourne").toString();
                item.timeAgo = moment_timezone_1.default(item.RcvTime * 1000).fromNow();
                return item;
            });
            return callback(err, enhancedResults);
        });
    }
    function getInterfaceVersion(department, callback) {
        var key = domain.interfaceVersionKey(department).key;
        return store.getInterfaceVersion(key, callback);
    }
    function checkDepartment(department, callback) {
        if (!lodash_1.default.isObject(department.heartbeat)) {
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
        if (index >= lodash_1.default.size(items)) {
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
    function conditionalLog(shouldLog, department, message, type, callback) {
        if (!shouldLog) {
            return callback(null);
        }
        return log(department, message, type, callback);
    }
    return {
        checkDepartment: checkDepartment,
        checkDepartments: checkDepartments,
        defaultMessage: domain.defaultMessage,
        log: log,
        conditionalLog: conditionalLog,
        logInterfaceVersion: logInterfaceVersion,
    };
};
//# sourceMappingURL=index.js.map