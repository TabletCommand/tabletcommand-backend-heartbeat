import _ from "lodash";

import {
  Department,
  HeartbeatMessage,
  IncomingHeartbeatMessage,
  ResolveInterfaceVersion,
} from "./types";

export default function domain() {
  function defaultMessage(): HeartbeatMessage {
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

  function keyForDepartment(department: Department, prefix: string) {
    let departmentId = "unknown";
    let resolved = false;
    if (department.id && _.isString(department.id)) {
      departmentId = department.id;
      resolved = true;
    } else if (department._id && _.isString(department._id)) {
      departmentId = department._id;
      resolved = true;
    }

    const key = `${prefix}:${departmentId}`;
    return {
      key,
      resolved,
    };
  }

  function interfaceVersionKey(department: any) {
    const result = keyForDepartment(department, "cad:v");
    return result;
  }

  function interfaceVersionFromMessage(message: unknown) {
    const defaultVersion = "Unknown";
    if (!_.isObject(message)) {
      return {
        resolved: false,
        version: defaultVersion,
      };
    }

    let msgInterface = "";
    if (_.isString((message as Record<string, unknown>).Interface)) {
      msgInterface = (message as Record<string, unknown>).Interface as string;
    }

    return extractVersion(msgInterface, defaultVersion);
  }

  function interfaceVersionForDepartment(department: Department, message: unknown): ResolveInterfaceVersion {
    const { 
      key,
    } = interfaceVersionKey(department);
    const {
      version: interfaceVersion,
      resolved
    } = interfaceVersionFromMessage(message);
    return {
      version: interfaceVersion,
      key,
      resolved
    };
  }

  function canLogInterfaceVersion(type: string): boolean {
    return _.isString(type) && (type === "incident");
  }

  function extractVersion(text: string, defaultVersion: string) {
    if (_.trim(text) === "") {
      return {
        version: defaultVersion,
        resolved: false,
      };
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

    return {
      version: removed.join(" "),
      resolved: true,
    };
  }

  function heartbeatKeyForTypeOfDepartment(type: string, department: Department) {
    const {
      keyPrefix
    } = keyForHeartbeat(type);
    return keyForDepartment(department, keyPrefix);
  }

  function heartbeatFromMessage(message: IncomingHeartbeatMessage): HeartbeatMessage {
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
    return msg;
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
}

export type DomainModule = ReturnType<typeof domain>;
