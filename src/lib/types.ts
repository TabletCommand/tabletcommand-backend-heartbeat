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
  Unit?: Unit[];
  unit?: Unit[];
  EntryDateTime?: string;
  ClosedDateTime?: string;

  //
  IncidentNumber?: string;
  Comment?: Comment[];
}

export type IncomingHeartbeatMessage = IncidentMessage | HeartbeatMessage;

export type RedisKey = string;
export type InterfaceVersion = string;

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
  version: InterfaceVersion,
  key: RedisKey,
  resolved: boolean,
}
