import { Department, HeartbeatMessage, IncomingHeartbeatMessage, ResolveInterfaceVersion, StoredHeartbeat } from "./types";
export default function domain(): {
    shouldLogInterfaceVersion: (type: string) => boolean;
    defaultMessage: () => HeartbeatMessage;
    extractVersion: (text: string, defaultVersion: string) => {
        version: string;
        resolved: boolean;
    };
    heartbeatFromMessage: (message: IncomingHeartbeatMessage, atDate: Date) => StoredHeartbeat;
    heartbeatKeyForTypeOfDepartment: (type: string, department: Department) => {
        key: string;
        resolved: boolean;
    };
    interfaceVersionForDepartment: (department: Department, message: IncomingHeartbeatMessage) => ResolveInterfaceVersion;
    interfaceVersionFromMessage: (message: IncomingHeartbeatMessage) => {
        version: string;
        resolved: boolean;
    };
    interfaceVersionKey: (department: Department) => {
        key: string;
        resolved: boolean;
    };
    keyForDepartment: (department: Department, prefix: string) => {
        key: string;
        resolved: boolean;
    };
    keyForHeartbeat: (type: string) => {
        keyPrefix: string;
        resolved: boolean;
    };
    defaultDelay: number;
    calculateDelay: (message: IncomingHeartbeatMessage, atDate: Date, fallback: number) => {
        delay: number;
        isHeartBeat: boolean;
        src: string;
        valid: boolean;
    };
};
export declare type DomainModule = ReturnType<typeof domain>;
