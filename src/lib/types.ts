// Partial import from models
export interface Department {
  _id?: string;
  id?: string; // legacy _id
  department?: string; // debug
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

  // These are calculated, not received. These types should be refactored.
  Delay: number; // In seconds
  H: number; // is heartbeat
}

export interface Unit {
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

export interface IncomingHeartbeatMessage extends HeartbeatMessage {
  Interface?: string;
  Unit?: Unit[];
  unit?: Unit[];
  EntryDateTime?: string;
  ClosedDateTime?: string;

  //
  IncidentNumber?: string;
  Comment?: Comment[];
}

export type RedisKey = string;
export type InterfaceVersion = string;

export interface StoredHeartbeat {
  RcvTime: number;
  Delay: number;
  H: number;
}

export interface EnhancedHeartbeat {
  RcvTime: number;
  RcvTimeSFO: string;
  RcvTimeMEL: string;
  RcvTimeISO: string;
  timeAgo: string;
  delay: number;
  heartbeat: boolean;
}

export interface ResolveInterfaceVersion {
  version: InterfaceVersion,
  key: RedisKey,
  resolved: boolean,
}
