// Partial import from models
export interface Department {
  _id?: string;
  id?: string; // legacy _id
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

export type RedisKey = string;
export type InterfaceVersion = string;

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
  version: InterfaceVersion,
  key: RedisKey,
  resolved: boolean,
}
