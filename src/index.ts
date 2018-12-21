"use strict";

/// <reference types="./lib/globals.d.ts" />
/// <reference types="redis" />
import * as redis from "redis";
import { IEnhancedHeartbeat, IStoreModule } from "./lib/store";

export declare interface IModuleDependency {
  redisClient: redis.RedisClient;
}

module.exports = function module(dependencies: IModuleDependency) {
  const client = dependencies.redisClient;

  const _ = require("lodash");
  const moment = require("moment-timezone");

  const helpers = require("tabletcommand-middleware").helpers;

  const domain = require("./lib/domain")() as IDomainModule;
  const store = require("./lib/store")({
    client,
  }) as IStoreModule;

  function log(department: any, message: any, type: string, callback: CallbackErr) {
    if (!_.isObject(department)) {
      return callback(null);
    }

    return domain.heartbeatKeyForTypeOfDepartment(type, department, (key) => {
      // Log Heartbeat cannot expire keys, because we'd lose the last message
      // we're limiting the list to maxListSize items instead
      return domain.heartbeatFromMessage(message, (msg) => {
        return store.storeHeartbeat(key, msg, (err) => {
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

      return domain.interfaceVersionForDepartment(department, message, (interfaceVersion, key, resolved) => {
        if (!resolved) {
          return callback(null);
        }

        return store.storeInterfaceVersion(key, interfaceVersion, callback);
      });
    });
  }

  function heartbeatItems(department: any, type: string, callback: Callback<[IEnhancedHeartbeat]>) {
    return domain.heartbeatKeyForTypeOfDepartment(type, department, (key) => {
      helpers.configureMomentOpts();
      return store.getHeartbeats(key, (err, decodedItems) => {
        const enhancedResults: [IEnhancedHeartbeat] = _.map(decodedItems, (item: IEnhancedHeartbeat) => {
          item.RcvTimeSFO = moment.unix(item.RcvTime).tz("America/Los_Angeles").toString();
          item.RcvTimeMEL = moment.unix(item.RcvTime).tz("Australia/Melbourne").toString();
          item.timeAgo = moment(item.RcvTime * 1000).fromNow();
          return item;
        });
        return callback(err, enhancedResults);
      });
    });
  }

  function getInterfaceVersion(department: any, callback: Callback<InterfaceVersion>) {
    return domain.interfaceVersionKey(department, (key) => {
      return store.getInterfaceVersion(key, callback);
    });
  }

  function checkDepartment(department: any, callback: Callback<any>) {
    if (!_.isObject(department.heartbeat)) {
      department.heartbeat = {
        incident: [],
        location: [],
        status: [],
        version: "",
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
          if (errLocation) {
            return callback(errLocation, department);
          }
          department.heartbeat.location = location;
          return getInterfaceVersion(department, (errVersion, version) => {
            department.heartbeat.version = version;
            return callback(errVersion, department);
          });
        });
      });
    });
  }

  function checkDepartments(items: any[], callback: Callback<any[]>) {
    return checkHeartbeats(items, 0, [], callback);
  }

  function checkHeartbeats(items: any[], index: number, storage: any[], callback: Callback<any[]>): void {
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
    logInterfaceVersion,
  };
};
