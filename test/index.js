"use strict";

const assert = require("chai").assert;

const redis = require("redis-js");
const redisClient = redis.createClient();

const index = require("../lib/index")({
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
    it("empty if no data is saved", (done) => {
      return index.checkDepartment(department, (err, d) => {
        assert.isNull(err);
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

        return done();
      });
    });
  });

  context("logInterfaceVersion", () => {
    it("doesn't save message if wrong type", (done) => {
      return index.logInterfaceVersion(department, message, "abcd", (err) => {
        assert.isNull(err);
        return index.checkDepartment(department, (err, d) => {
          assert.isNull(err);
          assert.equal(d.heartbeat.version, "");
          return done();
        });
      });
    });

    it("doesn't save message if it was not resolved", (done) => {
      return index.logInterfaceVersion(department, noMessage, type, (err) => {
        assert.isNull(err);
        return index.checkDepartment(department, (err, d) => {
          assert.isNull(err);
          assert.equal(d.heartbeat.version, "");
          return done();
        });
      });
    });

    it("saves correct interface version", (done) => {
      return index.logInterfaceVersion(department, message, type, (err) => {
        assert.isNull(err);
        return index.checkDepartment(department, (err, d) => {
          assert.isNull(err);
          assert.equal(d.heartbeat.version, message.Interface);
          return done();
        });
      });
    });

    it("missing version does not overwrite correct version", (done) => {
      return index.logInterfaceVersion(department, message, type, (err) => {
        assert.isNull(err);
        return index.checkDepartment(department, (err, d) => {
          assert.isNull(err);
          assert.equal(d.heartbeat.version, message.Interface);
          return index.logInterfaceVersion(department, noMessage, type, (err) => {
            assert.isNull(err);
            assert.equal(d.heartbeat.version, message.Interface);
            return done();
          });
        });
      });
    });
  });
});
