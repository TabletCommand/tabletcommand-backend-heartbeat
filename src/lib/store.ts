import * as redis from "redis";
import _ from "lodash";
import debug_module from "debug";

import { promisify } from "util";

import {
  InterfaceVersion,
  RedisKey,
  StoredHeartbeat,
} from "./types";

export default function libStore(dependencies: {
  client: redis.RedisClient,
}) {
  const { client } = dependencies;
  const maxListSize = 300;
  const debug = debug_module("heartbeat:lib:store");

  // try this: const getAsync = util.promisify<string|undefined>(this.redisClient.get.bind(this.redisClient)) – Ivan V. Mar 4 at 10:08

  const clientGet = promisify(client.get.bind(client));
  const clientSet = promisify(client.set.bind(client));
  // Hack for TS not recognizing the type
  // https://stackoverflow.com/questions/62320989/error-in-redis-client-del-function-with-typescript
  const clientLPush = promisify(client.lpush.bind(client)) as (arg0: string, arg1: string) => Promise<number>;
  const clientLTrim = promisify(client.ltrim.bind(client));
  const clientLRange = promisify(client.lrange.bind(client));

  async function storeInterfaceVersion(key: RedisKey, version: InterfaceVersion) {
    debug(`client.set ${key} ${version}.`);
    return clientSet(key, version);
  }

  async function getInterfaceVersion(key: RedisKey) {
    let version = "";
    const item = await clientGet(key);
    if (item && _.isString(item)) {
      version = item;
    }
    return version;
  }

  async function storeHeartbeat(key: RedisKey, msg: StoredHeartbeat) {
    const msgStr = JSON.stringify(msg);
    debug(`client.lpush ${key} ${msgStr}.`);
    await clientLPush(key, msgStr);
    debug(`client.ltrim ${key} 0, ${maxListSize - 1}.`);
    await clientLTrim(key, 0, maxListSize - 1);
  }

  async function getHeartbeats(key: RedisKey) {
    debug(`client.lrange ${key} 0, ${maxListSize}.`);
    const results = await clientLRange(key, 0, maxListSize);
    if (!_.isArray(results)) {
      return [];
    }
    const decoded: StoredHeartbeat[] = [];
    results.forEach((item) => {
      if (!_.isString(item)) {
        return;
      }
      try {
        const asObject = JSON.parse(item) as StoredHeartbeat;
        decoded.push(asObject);
      } catch (error) {
        console.log(`Could not parse ${item} as JSON.`);
        return;
      }
    });
    return decoded;
  }

  return {
    getHeartbeats,
    getInterfaceVersion,
    storeHeartbeat,
    storeInterfaceVersion,
  };
}

export type StoreModule = ReturnType<typeof libStore>;
