"use strict";

import * as redis from "redis";
import _ from "lodash";
import moment from "moment-timezone";
import debug_module from "debug";

import {
  Department,
  EnhancedHeartbeat,
  IncomingHeartbeatMessage,
  StoredHeartbeat,
} from "./lib/types";

import DomainModule from "./lib/domain";
import StoreModule from "./lib/store";

export default function indexModule(dependencies: {
  client: redis.RedisClient,
}) {
  const { client } = dependencies;

  const domain = DomainModule();
  const store = StoreModule({
    client,
  });
  const debug = debug_module("heartbeat:index");

  async function logInterfaceVersion(department: Department, message: IncomingHeartbeatMessage, type: string) {
    const shouldLog = domain.shouldLogInterfaceVersion(type);
    if (!shouldLog) {
      debug(`Log interface version ignored for type ${type} (${department.department}).`);
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

  async function log(department?: Department, message?: IncomingHeartbeatMessage, type?: string) {
    debug(`d:${JSON.stringify(department)} m:${JSON.stringify(message)} t:${type}.`);
    if (!_.isObject(department)) {
      return;
    }

    if (!_.isObject(message) || !_.isString(type)) {
      return;
    }

    const {
      key,
    } = domain.heartbeatKeyForTypeOfDepartment(type, department);

    const atDate = new Date();

    // Log Heartbeat cannot expire keys, because we'd lose the last message
    // we're limiting the list to maxListSize items instead
    const msg = domain.heartbeatFromMessage(message, atDate);
    debug(`Will log ${JSON.stringify(msg)} for ${department.department}.`);
    try {
      await store.storeHeartbeat(key, msg);
      await logInterfaceVersion(department, message, type);
    } catch (error) {
      console.log("Failed to log heartbeat", message, "for", department, "type", type);
    }
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

  async function heartbeatItems(department: Department, type: string): Promise<EnhancedHeartbeat[]> {
    const { key } = domain.heartbeatKeyForTypeOfDepartment(type, department);
    configureOpts();
    const decodedItems = await store.getHeartbeats(key);
    const enhancedResults: EnhancedHeartbeat[] = decodedItems.map((item: StoredHeartbeat) => {
      const t = item.RcvTime;
      const RcvTimeISO = moment.unix(t).toISOString();
      const timeAgo = moment(t * 1000).fromNow();

      const heartbeat = _.isObject(item) && _.isNumber(item.H) && item.H === 1;
      const delay = _.isObject(item) && _.isNumber(item.Delay) && _.isFinite(item.Delay) ? item.Delay : domain.defaultDelay;

      const out: EnhancedHeartbeat = {
        RcvTime: t,
        RcvTimeISO,
        timeAgo,
        delay,
        heartbeat,
        src: item.src ?? "",
        valid: item.v ?? true,
      };
      return out;
    });
    return enhancedResults;
  }

  async function getInterfaceVersion(department: Department) {
    const {
      key,
    } = domain.interfaceVersionKey(department);
    return await store.getInterfaceVersion(key);
  }

  async function checkDepartment(department: Department) {
    if (!_.isObject(department.heartbeat)) {
      department.heartbeat = {
        incident: [],
        location: [],
        status: [],
        version: "",
      };
    }

    try {
      const incident = await heartbeatItems(department, "incident");
      department.heartbeat.incident = incident;

      const status = await heartbeatItems(department, "status");
      department.heartbeat.status = status;

      const location = await heartbeatItems(department, "location");
      department.heartbeat.location = location;

      const version = await getInterfaceVersion(department);
      department.heartbeat.version = version;
    } catch (error) {
      console.log("error loading items for department", department._id, error);
    }
    return department;
  }

  async function checkHeartbeats(items: Department[]): Promise<Department[]> {
    const storage: Department[] = [];
    for (const item of items) {
      const department = await checkDepartment(item);
      storage.push(department);
    }
    return storage;
  }

  async function checkDepartments(items: Department[]) {
    return checkHeartbeats(items);
  }

  async function conditionalLog(shouldLog: boolean, department?: Department, message?: IncomingHeartbeatMessage, type?: string) {
    if (!shouldLog) {
      return;
    }

    await log(department, message, type);
  }

  return {
    checkDepartment,
    checkDepartments,
    defaultMessage: domain.defaultMessage,
    log,
    conditionalLog,
    logInterfaceVersion,
  };
}

export type IndexModule = ReturnType<typeof indexModule>;
