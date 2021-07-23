import * as redis from "redis";
import { InterfaceVersion, RedisKey, HeartbeatMessage, StoredHeartbeat } from "./types";
export default function libStore(dependencies: {
    client: redis.RedisClient;
}): {
    getHeartbeats: (key: RedisKey) => Promise<StoredHeartbeat[]>;
    getInterfaceVersion: (key: RedisKey) => Promise<string>;
    storeHeartbeat: (key: RedisKey, msg: HeartbeatMessage) => Promise<void>;
    storeInterfaceVersion: (key: RedisKey, version: InterfaceVersion) => Promise<unknown>;
};
export declare type StoreModule = ReturnType<typeof libStore>;
