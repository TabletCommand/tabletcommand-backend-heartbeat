declare interface IDomainModule {
  canLogInterfaceVersion(type: string, callback: Resolve<boolean>): void;

  defaultMessage(): IHeartbeatMessage;

  keyForHeartbeat(type: string): HeartbeatKey;
  keyForDepartment(department: any, prefix: string, callback: Resolve<RedisKey>): void;

  heartbeatFromMessage(message: any, callback: Resolve<IHeartbeatMessage>): void;
  heartbeatKeyForTypeOfDepartment(type: string, department: any, callback: Resolve<RedisKey>): void;

  interfaceVersionForDepartment(department: any, message: any, callback: ResolveInterfaceVersion): void;
  interfaceVersionKey(department: any, callback: Resolve<RedisKey>): void;
}

declare interface HeartbeatKey {
  keyPrefix: string;
  resolved: boolean;
}

declare interface IHeartbeatMessage {
  Time: string;
  Status: string;
  Message: string;
  RcvTime: number;
}

declare type RedisKey = string;
declare type InterfaceVersion = string;

declare type ResolveInterfaceVersion = (version: InterfaceVersion, key: RedisKey, resolved: boolean) => void;

module.exports = function domainModule() {
  const _ = require("lodash");

  function defaultMessage(): IHeartbeatMessage {
    const receivedTime = new Date().valueOf() / 1000;
    return {
      Message: "",
      RcvTime: receivedTime,
      Status: "OK",
      Time: `${receivedTime}`,
    };
  }

  function keyForHeartbeat(type: string) {
    let keyPrefix = "hb:x";
    let resolved = false;
    if (type === "incident") {
      keyPrefix = "hb:i";
      resolved = true;
    } else if (type === "status") {
      keyPrefix = "hb:s";
      resolved = true;
    } else if (type === "location") {
      keyPrefix = "hb:l";
      resolved = true;
    }

    return {
      keyPrefix,
      resolved
    };
  }

  function keyForDepartment(department: any, prefix: string, callback: Resolve<RedisKey>) {
    let departmentId = "unknown";
    let resolved = false;
    if (_.isString(department.id)) {
      departmentId = department.id;
      resolved = true;
    } else if (_.isString(department._id)) {
      departmentId = department._id;
      resolved = true;
    }

    const key = `${prefix}:${departmentId}`;
    return callback(key, resolved);
  }

  function interfaceVersionKey(department: any, callback: Resolve<RedisKey>) {
    return keyForDepartment(department, "cad:v", callback);
  }

  function interfaceVersionFromMessage(message: any, callback: Resolve<InterfaceVersion>) {
    const resolved = false;
    const defaultVersion = "Unknown";
    if (!_.isObject(message)) {
      return callback(defaultVersion, resolved);
    }

    if (!_.isString(message.Interface)) {
      return callback(defaultVersion, resolved);
    }

    return extractVersion(message.Interface, defaultVersion, callback);
  }

  function interfaceVersionForDepartment(department: any, message: any, callback: ResolveInterfaceVersion) {
    return interfaceVersionKey(department, (key) => {
      return interfaceVersionFromMessage(message, (interfaceVersion, resolved) => {
        return callback(interfaceVersion, key, resolved);
      });
    });
  }

  function canLogInterfaceVersion(type: string, callback: Resolve<boolean>) {
    const canLog = _.isString(type) && (type === "incident");
    return callback(canLog, true);
  }

  function extractVersion(text: string, defaultVersion: string, callback: Resolve<InterfaceVersion>) {
    let resolved = false;
    if (_.trim(text) === "") {
      return callback(defaultVersion, resolved);
    }

    const cleanup = [
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

    let clean = text;
    cleanup.forEach((regex) => {
      clean = clean.replace(regex, "");
    });

    const parts = clean.split(" ");
    const removed = parts.filter((item) => {
      const trimmed = _.trim(item);
      return trimmed !== "" && trimmed !== "-";
    });

    resolved = true;

    return callback(removed.join(" "), resolved);
  }

  function heartbeatKeyForTypeOfDepartment(type: string, department: any, callback: Resolve<RedisKey>) {
    const {
      keyPrefix
    } = keyForHeartbeat(type);
    return keyForDepartment(department, keyPrefix, callback);
  }

  function heartbeatFromMessage(message: any, callback: Resolve<IHeartbeatMessage>) {
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

    const msg = _.pick(message, ["Time", "Status", "Message", "RcvTime"]);
    msg.RcvTime = new Date().getTime() / 1000.0;
    return callback(msg, true);
  }

  return {
    canLogInterfaceVersion,
    defaultMessage,
    extractVersion,
    heartbeatFromMessage,
    heartbeatKeyForTypeOfDepartment,
    interfaceVersionForDepartment,
    interfaceVersionFromMessage,
    interfaceVersionKey,
    keyForDepartment,
    keyForHeartbeat,
  };
};
