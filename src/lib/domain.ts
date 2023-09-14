import _ from "lodash";
import debug_module from "debug";
import moment from "moment-timezone";

import {
  Comment,
  Department,
  HeartbeatMessage,
  IncomingHeartbeatMessage,
  ResolveInterfaceVersion,
  StoredHeartbeat,
  Unit,
} from "./types";

export default function domain() {
  const debug = debug_module("heartbeat:lib:domain");
  const defaultDelay = -7200;// Invalid value, 2h in the future

  function defaultMessage(atDate = new Date()): HeartbeatMessage {
    const receivedTime = atDate.valueOf() / 1000;
    return {
      Message: "OK",
      RcvTime: receivedTime,
      Status: "OK",
      Time: atDate.toISOString(),
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
    if (_.isString(message?.Interface)) {
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
    src: string,
    valid: boolean,
  } {
    let delay = fallback;
    let isHeartBeat = false;

    debug(`calculateDelay message: ${JSON.stringify(message)} atDate: ${atDate.toISOString()} fallback: ${fallback}`);

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

    const current = moment(atDate);
    const minDate = current.clone().subtract(48, "hours");
    let src = "?";
    let t = "";
    let valid = false;
    if (_.isObject(message)) {
      // Process heartbeat
      if ("Time" in message && _.isString(message.Time) && message.Time !== "" && !("IncidentNumber" in message)) {
        isHeartBeat = true;
        t = message.Time;
        src = "hb";
      } else if ("IncidentNumber" in message && _.isString(message.IncidentNumber) && message.IncidentNumber.trim() !== "") {
        let candidate = moment(0); // Start with an older date
        const incidentNumber = message.IncidentNumber ?? "X";
        // Process incident dates
        if (_.isString(message.EntryDateTime) && message.EntryDateTime !== "") {
          const mEntryDate = moment(message.EntryDateTime, true);
          if (mEntryDate.isValid() && candidate.isBefore(mEntryDate)) {
            candidate = mEntryDate;
            src = `${incidentNumber}-entry`;
          }
        }

        if (_.isString(message.ClosedDateTime) && message.ClosedDateTime !== "") {
          const mClosedDate = moment(message.ClosedDateTime, true);
          if (mClosedDate.isValid() && candidate.isBefore(mClosedDate)) {
            candidate = mClosedDate;
            src = `${incidentNumber}-closed`;
          }
        }

        // Extract from Unit
        if (_.isArray(message.Unit)) {
          message.Unit.forEach((u: Unit) => {
            if (!_.isObject(u)) {
              return;
            }

            for (const timeKey of unitKeys) {
              const maybeUnitTime = u[timeKey];
              if (_.isString(maybeUnitTime) && maybeUnitTime != "") {
                const mUnitTime = moment(maybeUnitTime, true);
                if (mUnitTime.isValid() && candidate.isBefore(mUnitTime)) {
                  candidate = mUnitTime;
                  src = `${incidentNumber}-${u.UnitID ?? "X"}-${timeKey}`;
                }
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

            if (_.isString(c.CommentDateTime) && c.CommentDateTime !== "") {
              const mCommentDate = moment(c.CommentDateTime, true);
              if (mCommentDate.isValid() && candidate.isBefore(mCommentDate)) {
                candidate = mCommentDate;
                src = `${incidentNumber}-commentDate`;
              }
            }
          });
        }

        if (candidate.isAfter(minDate)) {
          t = candidate.toISOString();
        }
      }
    }

    if (t !== "" && moment(t, true).isValid()) {
      const provided = moment(t, true); // Strict
      delay = moment.duration(current.diff(provided)).as("seconds");
      valid = true;
    }

    debug(`calculateDelay isHeartBeat:${isHeartBeat} t:${t} at:${atDate.toISOString()} delay:${delay} src: ${src}.`);

    return {
      delay,
      isHeartBeat,
      src,
      valid,
    };
  }

  function heartbeatFromMessage(message: IncomingHeartbeatMessage, atDate: Date): StoredHeartbeat {
    const {
      delay,
      isHeartBeat,
      src,
      valid,
    } = calculateDelay(message, atDate, defaultDelay);

    const msg: StoredHeartbeat = {
      Delay: delay,
      H: isHeartBeat ? 1 : 0,
      RcvTime: atDate.valueOf() / 1000.0,
      src,
      v: valid,
    };
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
