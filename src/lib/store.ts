
import * as redis from "redis";
import _ from "lodash";

import * as util from "util";

import {
  InterfaceVersion,
  RedisKey,
  IHeartbeatMessage,
  IStoredHeartbeat,
} from "./types";

export default function libStore(dependencies: {
  client: redis.RedisClient,
}) {
  const { client } = dependencies;
  const maxListSize: number = 30;

  const clientGet = util.promisify(client.get);
  const clientSet = util.promisify(client.set);

  async function storeInterfaceVersion(key: RedisKey, version: InterfaceVersion) {
    return clientSet(key, version);
  }

  function getInterfaceVersion(key: RedisKey, callback: Callback<InterfaceVersion>) {
    return client.get(key, (err: Error | null, result: unknown) => {
      let version = "";
      if (_.isString(result)) {
        version = result;
      }
      return callback(err, version);
    });
  }

  function storeHeartbeat(key: RedisKey, msg: IHeartbeatMessage, callback: CallbackErr) {
    return client.lpush(key, JSON.stringify(msg), (lpushErr: Error | null) => {
      if (lpushErr) {
        return callback(lpushErr);
      }
      return client.ltrim(key, 0, maxListSize - 1, (ltrimErr: Error | null) => {
        return callback(ltrimErr);
      });
    });
  }

  function getHeartbeats(key: RedisKey, callback: Callback<unknown[]>) {
    return client.lrange(key, 0, maxListSize, (err: Error | null, result: unknown[]) => {
      const decodedResults = _.map(result, (i: string) => {
        return JSON.parse(i) as IStoredHeartbeat;
      });

      return callback(err, decodedResults);
    });
  }

  return {
    getHeartbeats,
    getInterfaceVersion,
    storeHeartbeat,
    storeInterfaceVersion,
  };
};

export type StoreModule = ReturnType<typeof libStore>;
