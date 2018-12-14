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

  context("interfaceVersionFromMessage", () => {
    it("decodes resolved message", (done) => {
      const message = {
        "Interface": "Interface_Two_Way JSON message by Tablet Command Inc - 1.7.5 - Comment"
      };
      return domain.interfaceVersionFromMessage(message, (version, resolved) => {
        assert.equal(version, "Interface_Two_Way 1.7.5");
        assert.equal(resolved, true);
        return done();
      });
    });

    it("decodes missing message", (done) => {
      const message = {};
      return domain.interfaceVersionFromMessage(message, (version, resolved) => {
        assert.equal(version, "Unknown");
        assert.equal(resolved, false);
        return done();
      });
    });
  });

  context("extractVersion", () => {
    const messages = [
      //
      {
        a: "Interface_One_Way JSON message by Simple-Track - API - Comment",
        b: "Interface_One_Way API"
      },
      {
        a: "Interface_One_Way_Lehigh JSON message by Tablet Command - SQL 1.4.8 (Lehigh) - Incident Complete",
        b: "Interface_One_Way_Lehigh SQL 1.4.8 (Lehigh)"
      },
      {
        a: "Interface_One_Way_SQL JSON message by Simple-Track - Premier One SQL 1.4.6 - Incident Complete",
        b: "Interface_One_Way_SQL Premier One SQL 1.4.6"
      },
      {
        a: "Interface_One_Way_SQL JSON message by Simple-Track - TriTech SQL 1.4.5 - Incident Complete",
        b: "Interface_One_Way_SQL TriTech SQL 1.4.5"
      },
      {
        a: "Interface_Two_Way JSON message by Simple-Track - 1.7.3 - Comment",
        b: "Interface_Two_Way 1.7.3"
      },
      {
        a: "Interface_Two_Way JSON message by Simple-Track - 1.7.3 - Incident",
        b: "Interface_Two_Way 1.7.3"
      },
      {
        a: "Interface_Two_Way JSON message by Simple-Track - 1.7.3 - Units",
        b: "Interface_Two_Way 1.7.3"
      },
      {
        a: "Interface_Two_Way JSON message by Tablet Command Inc - 1.7.4 - Comment",
        b: "Interface_Two_Way 1.7.4"
      },
      {
        a: "Interface_Two_Way JSON message by Tablet Command Inc - 1.7.6 (SD) - Comment",
        b: "Interface_Two_Way 1.7.6 (SD)"
      },
      {
        a: "Tablet Command Service-PremierOne SQL JSON message by Tablet Command - 1.1 - Incident Complete",
        b: "Service-PremierOne SQL 1.1"
      },
      {
        a: "Tablet Command Service-TriTech SQL JSON message by Tablet Command - 1.0 - Incident Complete",
        b: "Service-TriTech SQL 1.0"
      }
    ];
    it("decodes known messages", (done) => {
      function testMessages(items, index, callback) {
        if (index >= items.length) {
          return callback(null);
        }

        const item = items[index];
        return domain.extractVersion(item.a, "abcd", function(version, resolved) {
          assert.equal(version, item.b);
          assert.equal(resolved, true);

          return testMessages(items, index + 1, callback);
        });
      }

      return testMessages(messages, 0, done);
    });
  });
});
