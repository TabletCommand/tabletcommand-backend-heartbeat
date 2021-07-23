"use strict";

const assert = require("chai").assert;

const redis = require("redis-js");
const redisClient = redis.createClient();

const index = require("../build/index")({
  redisClient
});

describe("index", () => {
  const department = {
    id: "abcd"
  };
  const message = {
    Interface: "v12"
  };
  const noMessage = {};
  const type = "incident";
  context("checkDepartment", () => {
    it("empty if no data is saved", async () => {
      const d = await index.checkDepartment(department);
      assert.isObject(d);
      assert.isObject(d.heartbeat);
      assert.isArray(d.heartbeat.incident);
      assert.isArray(d.heartbeat.location);
      assert.isArray(d.heartbeat.status);
      assert.isString(d.heartbeat.version);

      assert.equal(d.heartbeat.incident.length, 0);
      assert.equal(d.heartbeat.location.length, 0);
      assert.equal(d.heartbeat.status.length, 0);
      assert.equal(d.heartbeat.version, "");
    });
  });

  context("logInterfaceVersion", () => {
    it("doesn't save message if wrong type", async () => {
      await index.logInterfaceVersion(department, message, "abcd");
      const d = await index.checkDepartment(department);
      assert.equal(d.heartbeat.version, "");
    });

    it("doesn't save message if it was not resolved", async () => {
      await index.logInterfaceVersion(department, noMessage, type);
      const d = await index.checkDepartment(department);
      assert.equal(d.heartbeat.version, "");
    });

    it("saves correct interface version", async () => {
      await index.logInterfaceVersion(department, message, type);
      const d = await index.checkDepartment(department);
      assert.equal(d.heartbeat.version, message.Interface);
    });

    it("missing version does not overwrite correct version", async () => {
      await index.logInterfaceVersion(department, message, type);
      const d = await index.checkDepartment(department);
      assert.equal(d.heartbeat.version, message.Interface);
      await index.logInterfaceVersion(department, noMessage, type);
      const d2 = await index.checkDepartment(department);
      assert.equal(d2.heartbeat.version, message.Interface);
    });
  });
});
