"use strict";

/// <reference types="./lib/globals.d.ts" />
/// <reference types="redis" />
import * as redis from "redis";
import _ from "lodash";
import moment from "moment-timezone";

import {
  Department,
  IEnhancedHeartbeat,
  IStoredHeartbeat,
  InterfaceVersion,
} from "./lib/types";

export declare interface IModuleDependency {
  redisClient: redis.RedisClient;
}

import DomainModule from "./lib/domain";
import StoreModule from "./lib/store";

module.exports = function module(dependencies: IModuleDependency) {
  const { redisClient: client } = dependencies;

  const domain = DomainModule();
  const store = StoreModule({
    client,
  });

  function log(department: Department, message: unknown, type: string, callback: CallbackErr) {
    if (!_.isObject(department)) {
      return callback(null);
    }

    const {
      key,
      resolved,
    } = domain.heartbeatKeyForTypeOfDepartment(type, department);

    // Log Heartbeat cannot expire keys, because we'd lose the last message
    // we're limiting the list to maxListSize items instead
    const msg = domain.heartbeatFromMessage(message);
    return store.storeHeartbeat(key, msg, async (err: Error | null) => {
      if (err) {
        return callback(err);
      }

      await logInterfaceVersion(department, message, type);
      return callback(null);
    });
  }

  async function logInterfaceVersion(department: Department, message: unknown, type: string) {
    const canLog = domain.canLogInterfaceVersion(type);
    if (!canLog) {
      return;
    }

    const {
      version: interfaceVersion,
      key,
      resolved,
    } = domain.interfaceVersionForDepartment(department, message);
    if (!resolved) {
      return;
    }

    return await store.storeInterfaceVersion(key, interfaceVersion);
  }

  function configureOpts() {
    moment.updateLocale("en", {
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

  function heartbeatItems(department: Department, type: string, callback: Callback<[IEnhancedHeartbeat]>) {
    const { key } = domain.heartbeatKeyForTypeOfDepartment(type, department);
    configureOpts();
    return store.getHeartbeats(key, (err: Error | null, decodedItems: IStoredHeartbeat[]) => {
      const enhancedResults: IEnhancedHeartbeat[] = _.map(decodedItems, (item: IEnhancedHeartbeat) => {
        item.RcvTimeSFO = moment.unix(item.RcvTime).tz("America/Los_Angeles").toString();
        item.RcvTimeMEL = moment.unix(item.RcvTime).tz("Australia/Melbourne").toString();
        item.timeAgo = moment(item.RcvTime * 1000).fromNow();
        return item;
      });
      return callback(err, enhancedResults);
    });
  }

  function getInterfaceVersion(department: Department, callback: Callback<InterfaceVersion>) {
    const {
      key,
    } = domain.interfaceVersionKey(department);
    return store.getInterfaceVersion(key, callback);
  }

  function checkDepartment(department: Department, callback: Callback<Department>) {
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

  function checkHeartbeats(items: Department[], index: number, storage: Department[], callback: Callback<Department[]>): void {
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

  function conditionalLog(shouldLog: boolean, department: any, message: any, type: string, callback: CallbackErr) {
    if (!shouldLog) {
      return callback(null);
    }

    return log(department, message, type, callback);
  }

  return {
    checkDepartment,
    checkDepartments,
    defaultMessage: domain.defaultMessage,
    log,
    conditionalLog,
    logInterfaceVersion,
  };
};
