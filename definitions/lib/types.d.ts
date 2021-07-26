export interface Department {
    _id?: string;
    id?: string;
    department?: string;
    heartbeat?: {
        incident: EnhancedHeartbeat[];
        location: EnhancedHeartbeat[];
        status: EnhancedHeartbeat[];
        version: string;
    };
}
export interface HeartbeatKey {
    keyPrefix: string;
    resolved: boolean;
}
export interface HeartbeatMessage {
    Time: string;
    Status: string;
    Message: string;
    RcvTime: number;
}
export interface Unit {
    TimeArrived?: string;
    TimeEnroute?: string;
    TimeDispatched?: string;
}
export interface IncomingHeartbeatMessage extends HeartbeatMessage {
    Interface?: string;
    Unit?: Unit[];
    unit?: Unit[];
    EntryDateTime?: string;
}
export declare type RedisKey = string;
export declare type InterfaceVersion = string;
export interface StoredHeartbeat {
    RcvTime: number;
}
export interface EnhancedHeartbeat {
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
