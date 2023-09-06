import _ from "lodash";
import moment from "moment-timezone";

import {
  Comment,
  Department,
  HeartbeatMessage,
  IncomingHeartbeatMessage,
  ResolveInterfaceVersion,
  Unit,
} from "./types";

export default function domain() {
  const defaultDelay = -7200;// Invalid value, 2h

  function defaultMessage(): HeartbeatMessage {
    const receivedTime = new Date().valueOf() / 1000;
    return {
      Message: "",
      RcvTime: receivedTime,
      Status: "OK",
      Time: `${receivedTime}`,
      Delay: defaultDelay,
      H: -1,
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

  function interfaceVersionKey(department: Department) {
    const result = keyForDepartment(department, "cad:v");
    return result;
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

  function interfaceVersionFromMessage(message: IncomingHeartbeatMessage) {
    const defaultVersion = "Unknown";
    if (!_.isObject(message)) {
      return {
        resolved: false,
        version: defaultVersion,
      };
    }

    let msgInterface = "";
    if (_.isString(message.Interface)) {
      msgInterface = message.Interface;
    }

    return extractVersion(msgInterface, defaultVersion);
  }

  function interfaceVersionForDepartment(department: Department, message: IncomingHeartbeatMessage): ResolveInterfaceVersion {
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

  function shouldLogInterfaceVersion(type: string): boolean {
    return _.isString(type) && (type === "incident");
  }

  function heartbeatKeyForTypeOfDepartment(type: string, department: Department) {
    const {
      keyPrefix
    } = keyForHeartbeat(type);
    return keyForDepartment(department, keyPrefix);
  }

  function calculateDelay(message: IncomingHeartbeatMessage, atDate: Date, fallback: number): {
    delay: number,
    isHeartBeat: boolean,
  } {
    let delay = fallback;
    let isHeartBeat = false;

    const unitKeys: Array<keyof Unit> = [
      "TimeArrived",
      "TimeAtHospital",
      "TimeCleared",
      "TimeDispatched",
      "TimeEnroute",
      "TimePatient",
      "TimeStaged",
      "TimeTransport",
      "TimeTransporting",
    ];

    let t = "";
    if (_.isObject(message)) {
      // Process heartbeat
      if (_.isString(message.Time) && message.Time !== "" && !_.isString(message.IncidentNumber)) {
        isHeartBeat = true;
        t = message.Time;
      } else if (_.isString(message.IncidentNumber) && message.IncidentNumber.trim() !== "") {
        let candidate = new Date(0);
        // Process incident dates
        if (_.isString(message.EntryDateTime) && message.EntryDateTime !== "" && moment(message.EntryDateTime, true).isValid()) {
          candidate = new Date(Math.max(candidate.valueOf(), moment(message.EntryDateTime, true).valueOf()));
        }
        if (_.isString(message.ClosedDateTime) && message.ClosedDateTime !== "" && moment(message.ClosedDateTime, true).isValid()) {
          candidate = new Date(Math.max(candidate.valueOf(), moment(message.ClosedDateTime, true).valueOf()));
        }

        // Extract from Unit
        if (_.isArray(message.Unit)) {
          message.Unit.forEach((u: Unit) => {
            if (!_.isObject(u)) {
              return;
            }

            for (const timeKey of unitKeys) {
              const maybeUnitTime = u[timeKey];
              if (_.isString(maybeUnitTime) && maybeUnitTime != "" && moment(maybeUnitTime, true).isValid()) {
                candidate = new Date(Math.max(candidate.valueOf(), moment(maybeUnitTime, true).valueOf()));
              }
            }
          });
        }

        // Extract from Comment
        if (_.isArray(message.Comment)) {
          message.Comment.forEach((c: Comment) => {
            if (!_.isObject(c)) {
              return;
            }

            if (_.isString(c.CommentDateTime) && c.CommentDateTime !== "" && moment(c.CommentDateTime, true).isValid()) {
              candidate = new Date(Math.max(candidate.valueOf(), moment(c.CommentDateTime, true).valueOf()));
            }
          });
        }

        t = candidate.toISOString();
      }
    }

    if (moment(t, true).isValid()) {
      const provided = moment(t, true); // Strict
      const current = moment(atDate);
      delay = moment.duration(current.diff(provided)).as("seconds");
    }

    return {
      delay,
      isHeartBeat,
    };
  }

  function heartbeatFromMessage(message: IncomingHeartbeatMessage, atDate: Date): HeartbeatMessage {
    if (!_.isString(message.Time)) {
      // If no .Time provided, peek into .Unit
      if (_.isArray(message.Unit)) {
        let unitTime = null;
        _.each(message.Unit, (unit) => {
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

    const {
      delay,
      isHeartBeat,
    } = calculateDelay(message, atDate, defaultDelay);

    const msg = _.pick(message, ["Time", "Status", "Message", "RcvTime", "Delay", "H"]);
    msg.RcvTime = atDate.valueOf() / 1000.0;
    msg.Delay = delay;
    msg.H = isHeartBeat ? 1 : 0;
    return msg;
  }

  return {
    shouldLogInterfaceVersion,
    defaultMessage,
    extractVersion,
    heartbeatFromMessage,
    heartbeatKeyForTypeOfDepartment,
    interfaceVersionForDepartment,
    interfaceVersionFromMessage,
    interfaceVersionKey,
    keyForDepartment,
    keyForHeartbeat,

    defaultDelay,
    calculateDelay,
  };
}

export type DomainModule = ReturnType<typeof domain>;
