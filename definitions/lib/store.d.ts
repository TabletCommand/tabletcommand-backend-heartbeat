import * as redis from "redis";
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
