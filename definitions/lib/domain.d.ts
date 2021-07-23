import { Department, HeartbeatMessage, IncomingHeartbeatMessage, ResolveInterfaceVersion } from "./types";
export default function domain(): {
    canLogInterfaceVersion: (type: string) => boolean;
    defaultMessage: () => HeartbeatMessage;
    extractVersion: (text: string, defaultVersion: string) => {
        version: string;
        resolved: boolean;
    };
    heartbeatFromMessage: (message: IncomingHeartbeatMessage) => HeartbeatMessage;
    heartbeatKeyForTypeOfDepartment: (type: string, department: Department) => {
        key: string;
        resolved: boolean;
    };
    interfaceVersionForDepartment: (department: Department, message: unknown) => ResolveInterfaceVersion;
    interfaceVersionFromMessage: (message: unknown) => {
        resolved: boolean;
        version: string;
    };
    interfaceVersionKey: (department: any) => {
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
};
export declare type DomainModule = ReturnType<typeof domain>;
