"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
module.exports = function storeModule(dependencies) {
    var client = dependencies.client;
    var maxListSize = 30;
    function storeInterfaceVersion(key, version, callback) {
        return client.set(key, version, callback);
    }
    function getInterfaceVersion(key, callback) {
        return client.get(key, function (err, result) {
            var version = "";
            if (lodash_1.default.isString(result)) {
                version = result;
            }
            return callback(err, version);
        });
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
    function getHeartbeats(key, callback) {
        return client.lrange(key, 0, maxListSize, function (err, result) {
            var decodedResults = lodash_1.default.map(result, function (i) {
                return JSON.parse(i);
            });
            return callback(err, decodedResults);
        });
    }
    return {
        getHeartbeats: getHeartbeats,
        getInterfaceVersion: getInterfaceVersion,
        storeHeartbeat: storeHeartbeat,
        storeInterfaceVersion: storeInterfaceVersion,
    };
};
//# sourceMappingURL=store.js.map