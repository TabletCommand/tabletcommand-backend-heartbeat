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
var util_1 = require("util");
function libStore(dependencies) {
    var client = dependencies.client;
    var maxListSize = 30;
    var clientGet = util_1.promisify(client.get).bind(client);
    var clientSet = util_1.promisify(client.set).bind(client);
    // Hack for TS not recognizing the type
    // https://stackoverflow.com/questions/62320989/error-in-redis-client-del-function-with-typescript
    var clientLPush = util_1.promisify(client.lpush).bind(client);
    var clientLTrim = util_1.promisify(client.ltrim).bind(client);
    var clientLRange = util_1.promisify(client.lrange).bind(client);
    function storeInterfaceVersion(key, version) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, clientSet(key, version)];
            });
        });
    }
    function getInterfaceVersion(key) {
        return __awaiter(this, void 0, void 0, function () {
            var version, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        version = "";
                        return [4 /*yield*/, clientGet(key)];
                    case 1:
                        item = _a.sent();
                        if (item && lodash_1.default.isString(item)) {
                            version = item;
                        }
                        return [2 /*return*/, version];
                }
            });
        });
    }
    function storeHeartbeat(key, msg) {
        return __awaiter(this, void 0, void 0, function () {
            var msgStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        msgStr = JSON.stringify(msg);
                        return [4 /*yield*/, clientLPush(key, msgStr)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, clientLTrim(key, 0, maxListSize - 1)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function getHeartbeats(key) {
        return __awaiter(this, void 0, void 0, function () {
            var results, decoded;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, clientLRange(key, 0, maxListSize)];
                    case 1:
                        results = _a.sent();
                        if (!lodash_1.default.isArray(results)) {
                            return [2 /*return*/, []];
                        }
                        decoded = [];
                        results.forEach(function (item) {
                            if (!lodash_1.default.isString(item)) {
                                return;
                            }
                            try {
                                var asObject = JSON.parse(item);
                                decoded.push(asObject);
                            }
                            catch (error) {
                                console.log("Could not parse " + item + " as JSON.");
                                return;
                            }
                        });
                        return [2 /*return*/, decoded];
                }
            });
        });
    }
    return {
        getHeartbeats: getHeartbeats,
        getInterfaceVersion: getInterfaceVersion,
        storeHeartbeat: storeHeartbeat,
        storeInterfaceVersion: storeInterfaceVersion,
    };
}
exports.default = libStore;
//# sourceMappingURL=store.js.map