"use strict";

const assert = require("chai").assert;
const domain = require("../lib/lib/domain")();

describe("domain", () => {
  context("heartbeatKeyForTypeOfDepartment", () => {
    it("incident", (done) => {
      const department = {
        id: "abcd"
      };
      return domain.heartbeatKeyForTypeOfDepartment("incident", department, (key, resolved) => {
        assert.equal(key, "hb:i:abcd");
        return done();
      });
    });
  });
});
