import { IHeartbeatMessage, Department, ResolveInterfaceVersion } from "./types";
export default function domain(): {
    canLogInterfaceVersion: (type: string) => boolean;
    defaultMessage: () => IHeartbeatMessage;
    extractVersion: (text: string, defaultVersion: string) => {
        version: string;
        resolved: boolean;
    };
    heartbeatFromMessage: (message: any) => IHeartbeatMessage;
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
