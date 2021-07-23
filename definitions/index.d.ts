import * as redis from "redis";
import { Department, IncomingHeartbeatMessage } from "./lib/types";
export default function indexModule(dependencies: {
    client: redis.RedisClient;
}): {
    checkDepartment: (department: Department) => Promise<Department>;
    checkDepartments: (items: Department[]) => Promise<Department[]>;
    defaultMessage: () => import("./lib/types").HeartbeatMessage;
    log: (department?: Department | undefined, message?: IncomingHeartbeatMessage | undefined, type?: string | undefined) => Promise<void>;
    conditionalLog: (shouldLog: boolean, department?: Department | undefined, message?: IncomingHeartbeatMessage | undefined, type?: string | undefined) => Promise<void>;
    logInterfaceVersion: (department: Department, message: IncomingHeartbeatMessage, type: string) => Promise<unknown>;
};
export declare type IndexModule = ReturnType<typeof indexModule>;
