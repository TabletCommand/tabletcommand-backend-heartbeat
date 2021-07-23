export interface Department {
    _id?: string;
    id?: string;
    heartbeat: {
        incident: unknown[];
        location: unknown[];
        status: unknown[];
        version: string;
    };
}
export interface HeartbeatKey {
    keyPrefix: string;
    resolved: boolean;
}
export interface IHeartbeatMessage {
    Time: string;
    Status: string;
    Message: string;
    RcvTime: number;
}
export declare type RedisKey = string;
export declare type InterfaceVersion = string;
export interface IStoredHeartbeat {
    RcvTime: number;
}
export interface IEnhancedHeartbeat {
    RcvTime: number;
    RcvTimeSFO: string;
    RcvTimeMEL: string;
    timeAgo: string;
}
export interface ResolveInterfaceVersion {
    version: InterfaceVersion;
    key: RedisKey;
    resolved: boolean;
}
