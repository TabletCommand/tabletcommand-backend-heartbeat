
import * as redis from "redis";
import _ from "lodash";

export declare interface IStoreDependency {
  client: redis.RedisClient;
}

export declare interface IStoreModule {
  getHeartbeats(key: RedisKey, callback: Callback<IStoredHeartbeat[]>): void;
  getInterfaceVersion(key: RedisKey, callback: Callback<InterfaceVersion>): void;
  storeInterfaceVersion(key: RedisKey, version: InterfaceVersion, callback: CallbackErr): void;
  storeHeartbeat(key: RedisKey, msg: IHeartbeatMessage, callback: CallbackErr): void;
}

export declare interface IStoredHeartbeat {
  RcvTime: number;
}

export declare interface IEnhancedHeartbeat {
  RcvTime: number;
  RcvTimeSFO: string;
  RcvTimeMEL: string;
  timeAgo: string;
}

module.exports = function storeModule(dependencies: IStoreDependency): IStoreModule {
  const client = dependencies.client;

  const maxListSize: number = 30;

  function storeInterfaceVersion(key: RedisKey, version: InterfaceVersion, callback: CallbackErr) {
    return client.set(key, version, callback);
  }

  function getInterfaceVersion(key: RedisKey, callback: Callback<InterfaceVersion>) {
    return client.get(key, (err, result) => {
      let version = "";
      if (_.isString(result)) {
        version = result;
      }
      return callback(err, version);
    });
  }

  function storeHeartbeat(key: RedisKey, msg: IHeartbeatMessage, callback: CallbackErr) {
    return client.lpush(key, JSON.stringify(msg), (lpushErr) => {
      if (lpushErr) {
        return callback(lpushErr);
      }
      return client.ltrim(key, 0, maxListSize - 1, (ltrimErr) => {
        return callback(ltrimErr);
      });
    });
  }

  function getHeartbeats(key: RedisKey, callback: Callback<IStoredHeartbeat[]>) {
    return client.lrange(key, 0, maxListSize, (err, result) => {
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
