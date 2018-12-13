"use strict";

/// <reference types="redis" />
import * as redis from "redis";

module.exports = function module(dependencies: any) {
  const client = dependencies.redisClient as redis.RedisClient;

  const _ = require("lodash");
  const moment = require("moment-timezone");

  const helpers = require("tabletcommand-middleware").helpers;

  const maxListSize: number = 30;

  type Resolve<T> = (resolved: T) => void;
  type Callback<T> = (err: Error | null, result: T) => void;
  interface IHeartbeatMessage {
    Time: string;
    Status: string;
    Message: string;
    RcvTime: number;
  }

  function keyForHeartbeat(type: string, callback: Resolve<string>) {
    let keyPrefix = "hb:x";
    if (type === "incident") {
      keyPrefix = "hb:i";
    } else if (type === "status") {
      keyPrefix = "hb:s";
    } else if (type === "location") {
      keyPrefix = "hb:l";
    }

    return callback(keyPrefix);
  }

  function keyForDepartment(department: any, prefix: string, callback: Resolve<string>) {
    let departmentId = "unknown";
    if (_.isString(department.id)) {
      departmentId = department.id;
    } else if (_.isString(department._id)) {
      departmentId = department._id;
    }

    const key = `${prefix}:${departmentId}`;
    return callback(key);
  }

  function cleanupMessage(message: any, callback: Resolve<IHeartbeatMessage>) {
    if (!_.isString(message.Time)) {
      // If no .Time provided, peek into .Unit
      if (_.isArray(message.Unit)) {
        let unitTime = null;
        _.each(message.Unit, (unit: any) => {
          if (_.isString(unit.TimeArrived)) {
            unitTime = unit.TimeArrived;
          } else if (_.isString(unit.TimeEnroute)) {
            unitTime = unit.TimeEnroute;
          } else if (_.isString(unit.TimeDispatched)) {
            unitTime = unit.TimeDispatched;
          }
        });

        if (!_.isNull(unitTime) && !_.isUndefined(unitTime)) {
          message.Time = unitTime;
        }
      } else if (_.isString(message.EntryDateTime)) {
        message.Time = message.EntryDateTime;
      }
    }

    const msg = _.pick(message, ["Time", "Status", "Message"]);
    msg.RcvTime = new Date().getTime() / 1000.0;
    return callback(msg);
  }

  function log(department: any, message: any, type: string, callback: any) {
    if (!_.isObject(department)) {
      // console.log("Undefined department", department);
      return callback(null);
    }

    if (!helpers.itemIsTrue(department, "heartbeatEnabled")) {
      return callback(null);
    }

    return keyForHeartbeat(type, (keyPrefix) => {
      // Log Heartbeat cannot expire keys, because we'd lose the last message
      // we're limiting the list to maxListSize items instead
      return keyForDepartment(department, keyPrefix, (key) => {
        return cleanupMessage(message, (msg) => {
          return client.lpush(key, JSON.stringify(msg), (lpushErr) => {
            if (lpushErr) {
              return callback(lpushErr);
            }
            return client.ltrim(key, 0, maxListSize - 1, (ltrimErr) => {
              return callback(ltrimErr);
            });
          });
        });
      });
    });
  }

  function heartbeatItems(department: any, type: string, callback: Callback<any[]>) {
    return keyForHeartbeat(type, (keyPrefix) => {
      return keyForDepartment(department, keyPrefix, (key) => {

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

  function defaultMessage(): IHeartbeatMessage {
    const receivedTime = new Date().valueOf() / 1000;
    const message: IHeartbeatMessage = {
      Message: "",
      RcvTime: receivedTime,
      Status: "OK",
      Time: `${receivedTime}`,
    };
    return message;
  }

  return {
    checkDepartment,
    checkDepartments,
    defaultMessage,
    log,
  };
};
