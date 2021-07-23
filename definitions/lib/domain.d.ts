declare interface IDomainModule {
    canLogInterfaceVersion(type: string, callback: Resolve<boolean>): void;
    defaultMessage(): IHeartbeatMessage;
    keyForHeartbeat(type: string): HeartbeatKey;
    keyForDepartment(department: any, prefix: string, callback: Resolve<RedisKey>): void;
    heartbeatFromMessage(message: any, callback: Resolve<IHeartbeatMessage>): void;
    heartbeatKeyForTypeOfDepartment(type: string, department: any, callback: Resolve<RedisKey>): void;
    interfaceVersionForDepartment(department: any, message: any, callback: ResolveInterfaceVersion): void;
    interfaceVersionKey(department: any, callback: Resolve<RedisKey>): void;
}
declare interface HeartbeatKey {
    keyPrefix: string;
    resolved: boolean;
}
declare interface IHeartbeatMessage {
    Time: string;
    Status: string;
    Message: string;
    RcvTime: number;
}
declare type RedisKey = string;
declare type InterfaceVersion = string;
declare type ResolveInterfaceVersion = (version: InterfaceVersion, key: RedisKey, resolved: boolean) => void;
