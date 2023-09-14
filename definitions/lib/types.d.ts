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
    Interface?: string;
}
export interface Unit {
    UnitID: string;
    TimeArrived?: string;
    TimeAtHospital?: string;
    TimeCleared?: string;
    TimeDispatched?: string;
    TimeEnroute?: string;
    TimePatient?: string;
    TimeStaged?: string;
    TimeTransport?: string;
    TimeTransporting?: string;
}
export interface Comment {
    CommentDateTime?: string;
}
export interface IncidentMessage {
    Interface?: string;
    Unit?: Partial<Unit>[];
    unit?: Partial<Unit>[];
    EntryDateTime?: string;
    ClosedDateTime?: string;
    IncidentNumber: string;
    Comment?: Comment[];
}
export declare type IncomingHeartbeatMessage = Partial<IncidentMessage> | Partial<HeartbeatMessage>;
export declare type RedisKey = string;
export declare type InterfaceVersion = string;
export interface StoredHeartbeat {
    RcvTime: number;
    Delay: number;
    H: number;
    src: string;
    v: boolean;
}
export interface EnhancedHeartbeat {
    RcvTime: number;
    RcvTimeISO: string;
    timeAgo: string;
    delay: number;
    heartbeat: boolean;
    src: string;
    valid: boolean;
}
export interface ResolveInterfaceVersion {
    version: InterfaceVersion;
    key: RedisKey;
    resolved: boolean;
}
