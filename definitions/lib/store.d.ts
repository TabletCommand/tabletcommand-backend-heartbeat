import * as redis from "redis";
import { InterfaceVersion, RedisKey, IHeartbeatMessage } from "./types";
export default function libStore(dependencies: {
    client: redis.RedisClient;
}): {
    getHeartbeats: (key: RedisKey, callback: Callback<unknown[]>) => boolean;
    getInterfaceVersion: (key: RedisKey, callback: Callback<InterfaceVersion>) => boolean;
    storeHeartbeat: (key: RedisKey, msg: IHeartbeatMessage, callback: CallbackErr) => boolean;
    storeInterfaceVersion: (key: RedisKey, version: InterfaceVersion) => Promise<unknown>;
};
export declare type StoreModule = ReturnType<typeof libStore>;
