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
function indexModule(dependencies) {
    var client = dependencies.client;
    var domain = domain_1.default();
    var store = store_1.default({
        client: client,
    });
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
    function log(department, message, type) {
        return __awaiter(this, void 0, void 0, function () {
            var key, msg, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!lodash_1.default.isObject(department)) {
                            return [2 /*return*/];
                        }
                        if (!lodash_1.default.isString(message) || !lodash_1.default.isString(type)) {
                            return [2 /*return*/];
                        }
                        key = domain.heartbeatKeyForTypeOfDepartment(type, department).key;
                        msg = domain.heartbeatFromMessage(message);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, store.storeHeartbeat(key, msg)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, logInterfaceVersion(department, message, type)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.log("Failed to log heartbeat", message, "for", department, "type", type);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
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
    function heartbeatItems(department, type) {
        return __awaiter(this, void 0, void 0, function () {
            var key, decodedItems, enhancedResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = domain.heartbeatKeyForTypeOfDepartment(type, department).key;
                        configureOpts();
                        return [4 /*yield*/, store.getHeartbeats(key)];
                    case 1:
                        decodedItems = _a.sent();
                        enhancedResults = decodedItems.map(function (item) {
                            var t = item.RcvTime;
                            var RcvTimeSFO = moment_timezone_1.default.unix(t).tz("America/Los_Angeles").toString();
                            var RcvTimeMEL = moment_timezone_1.default.unix(t).tz("Australia/Melbourne").toString();
                            var timeAgo = moment_timezone_1.default(t * 1000).fromNow();
                            return {
                                RcvTime: t,
                                RcvTimeMEL: RcvTimeMEL,
                                RcvTimeSFO: RcvTimeSFO,
                                timeAgo: timeAgo
                            };
                        });
                        return [2 /*return*/, enhancedResults];
                }
            });
        });
    }
    function getInterfaceVersion(department) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = domain.interfaceVersionKey(department).key;
                        return [4 /*yield*/, store.getInterfaceVersion(key)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    function checkDepartment(department) {
        return __awaiter(this, void 0, void 0, function () {
            var incident, status_1, location_1, version, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!lodash_1.default.isObject(department.heartbeat)) {
                            department.heartbeat = {
                                incident: [],
                                location: [],
                                status: [],
                                version: "",
                            };
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, heartbeatItems(department, "incident")];
                    case 2:
                        incident = _a.sent();
                        department.heartbeat.incident = incident;
                        return [4 /*yield*/, heartbeatItems(department, "status")];
                    case 3:
                        status_1 = _a.sent();
                        department.heartbeat.status = status_1;
                        return [4 /*yield*/, heartbeatItems(department, "location")];
                    case 4:
                        location_1 = _a.sent();
                        department.heartbeat.location = location_1;
                        return [4 /*yield*/, getInterfaceVersion(department)];
                    case 5:
                        version = _a.sent();
                        department.heartbeat.version = version;
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        console.log("error loading items for department", department._id, error_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/, department];
                }
            });
        });
    }
    function checkHeartbeats(items) {
        return __awaiter(this, void 0, void 0, function () {
            var storage, _i, items_1, item, department;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        storage = [];
                        _i = 0, items_1 = items;
                        _a.label = 1;
                    case 1:
                        if (!(_i < items_1.length)) return [3 /*break*/, 4];
                        item = items_1[_i];
                        return [4 /*yield*/, checkDepartment(item)];
                    case 2:
                        department = _a.sent();
                        storage.push(department);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, storage];
                }
            });
        });
    }
    function checkDepartments(items) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, checkHeartbeats(items)];
            });
        });
    }
    function conditionalLog(shouldLog, department, message, type) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!shouldLog) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, log(department, message, type)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    return {
        checkDepartment: checkDepartment,
        checkDepartments: checkDepartments,
        defaultMessage: domain.defaultMessage,
        log: log,
        conditionalLog: conditionalLog,
        logInterfaceVersion: logInterfaceVersion,
    };
}
exports.default = indexModule;
//# sourceMappingURL=index.js.map