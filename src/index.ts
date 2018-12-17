"use strict";

/// <reference types="./lib/globals.d.ts" />
/// <reference types="redis" />
import * as redis from "redis";

module.exports = function module(dependencies: any) {
  const client = dependencies.redisClient as redis.RedisClient;

  const _ = require("lodash");
  const moment = require("moment-timezone");

  const helpers = require("tabletcommand-middleware").helpers;

  const domain = require("./lib/domain")() as IDomainModule;

  const maxListSize: number = 30;

  function log(department: any, message: any, type: string, callback: CallbackErr) {
    if (!_.isObject(department)) {
      return callback(null);
    }

    return domain.heartbeatKeyForTypeOfDepartment(type, department, (key) => {
      // Log Heartbeat cannot expire keys, because we'd lose the last message
      // we're limiting the list to maxListSize items instead
      return domain.heartbeatFromMessage(message, (msg) => {
        return storeHeartbeat(key, msg, (err) => {
          if (err) {
            return callback(err);
          }

          return logInterfaceVersion(department, message, type, callback);
        });
      });
    });
  }

  function logInterfaceVersion(department: any, message: any, type: string, callback: CallbackErr) {
    return domain.canLogInterfaceVersion(type, (canLog) => {
      if (!canLog) {
        return callback(null);
      }

      return domain.interfaceVersionForDepartment(department, message, (interfaceVersion, key) => {
        return storeInterfaceVersion(key, interfaceVersion, callback);
      });
    });
  }

  function storeInterfaceVersion(key: RedisKey, version: InterfaceVersion, callback: CallbackErr) {
    return client.set(key, version, callback);
  }

  function storeHeartbeat(key: RedisKey, msg: IHeartbeatMessage, callback: CallbackErr) {
    return client.lpush(key, JSON.stringify(msg), (lpushErr) => {
      if (lpushErr) {
        return callback(lpushErr);
      }
      return client.ltrim(key, 0, maxListSize - 1, (ltrimErr) => {
        return callback(ltrimErr);
      });
    });
  }

  function heartbeatItems(department: any, type: string, callback: Callback<any[]>) {
    return domain.heartbeatKeyForTypeOfDepartment(type, department, (key) => {
      helpers.configureMomentOpts();
      return client.lrange(key, 0, maxListSize, (err, result) => {
        const enhancedResults = _.map(result, (i: string) => {
          const item = JSON.parse(i);
          item.RcvTimeSFO = moment.unix(item.RcvTime).tz("America/Los_Angeles").toString();
          item.RcvTimeMEL = moment.unix(item.RcvTime).tz("Australia/Melbourne").toString();
          item.timeAgo = moment(item.RcvTime * 1000).fromNow();
          return item;
        });
        return callback(err, enhancedResults);
      });
    });
  }

  function checkDepartment(department: any, callback: Callback<any>) {
    if (!_.isObject(department.heartbeat)) {
      department.heartbeat = {
        incident: [],
        location: [],
        status: [],
      };
    }

    return heartbeatItems(department, "incident", (errIncident, incident) => {
      if (errIncident) {
        return callback(errIncident, department);
      }
      department.heartbeat.incident = incident;

      return heartbeatItems(department, "status", (errStatus, status) => {
        if (errStatus) {
          return callback(errStatus, department);
        }
        department.heartbeat.status = status;

        return heartbeatItems(department, "location", (errLocation, location) => {
          department.heartbeat.location = location;
          return callback(errLocation, department);
        });
      });
    });
  }

  function checkDepartments(items: any[], callback: Callback<any[]>) {
    return checkHeartbeats(items, 0, [], callback);
  }

  function checkHeartbeats(items: any[], index: number, storage: any[], callback: Callback<any[]>): any {
    if (index >= _.size(items)) {
      return callback(null, storage);
    }

    const department = items[index];
    return checkDepartment(department, (err, dept) => {
      if (err) {
        return callback(err, []);
      }

      storage.push(dept);
      return checkHeartbeats(items, index + 1, storage, callback);
    });
  }

  return {
    checkDepartment,
    checkDepartments,
    defaultMessage: domain.defaultMessage,
    log,
  };
};
