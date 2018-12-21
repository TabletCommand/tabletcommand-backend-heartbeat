"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function storeModule(dependencies) {
    var _ = require("lodash");
    var client = dependencies.client;
    var maxListSize = 30;
    function storeInterfaceVersion(key, version, callback) {
        return client.set(key, version, callback);
    }
    function getInterfaceVersion(key, callback) {
        return client.get(key, function (err, result) {
            var version = "";
            if (_.isString(result)) {
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
            var decodedResults = _.map(result, function (i) {
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
