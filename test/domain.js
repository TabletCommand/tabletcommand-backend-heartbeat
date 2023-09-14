"use strict";

const assert = require("chai").assert;
const domain = require("../build/lib/domain").default();

describe("domain", () => {
  context("heartbeatKeyForTypeOfDepartment", () => {
    it("incident", () => {
      const department = {
        id: "abcd"
      };
      const {
        key
      } = domain.heartbeatKeyForTypeOfDepartment("incident", department);
      assert.equal(key, "hb:i:abcd");
    });
  });

  context("interfaceVersionFromMessage", () => {
    it("decodes resolved message", () => {
      const message = {
        "Interface": "Interface_Two_Way JSON message by Tablet Command Inc - 1.7.5 - Comment"
      };
      const {
        version,
        resolved,
      } = domain.interfaceVersionFromMessage(message);
      assert.equal(version, "Interface_Two_Way 1.7.5");
      assert.equal(resolved, true);
    });

    it("decodes missing message", () => {
      const message = {};
      const {
        version,
        resolved,
      } = domain.interfaceVersionFromMessage(message);
      assert.equal(version, "Unknown");
      assert.equal(resolved, false);
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
    it("decodes known messages", () => {
      for (const item of messages) {
        const {
          version,
          resolved,
        } = domain.extractVersion(item.a, "abcd");
        assert.equal(version, item.b);
        assert.equal(resolved, true);
      }
    });
  });

  context("calculateDelay", () => {
    const atDate = new Date("2023-08-30T01:27:47-07:00");
    const fallback = -80;
    it("delay for heartbeat", () => {
      const heartbeatMessage = {
        Time: "2023-08-30T01:27:14-07:00",
        Status: "Green",
        Info: "Incidents - Checked: 4 | Active: 4 | Sent: 2 | Removed: 0 | Last Success: 2018-07-09 22:16:38-04:00",
        Message: "Interface_One_Way_SQL JSON Heartbeat by Simple-Track - Premier One SQL 1.4.6"
      };
      const {
        delay,
        isHeartBeat,
      } = domain.calculateDelay(heartbeatMessage, atDate, fallback);

      assert.deepEqual(isHeartBeat, true);
      assert.deepEqual(delay, 33);
    });

    it("delay for incident - entry date time", () => {
      const heartbeatMessage = {
        EntryDateTime: "2023-08-30T01:27:14-07:00",
        IncidentNumber: "FC-1234",
      };
      const {
        delay,
        isHeartBeat,
      } = domain.calculateDelay(heartbeatMessage, atDate, fallback);

      assert.deepEqual(isHeartBeat, false);
      assert.deepEqual(delay, 33);
    });

    it("delay for incident - unit - some time", () => {
      const heartbeatMessage = {
        EntryDateTime: "2023-08-30T01:17:14-07:00",
        IncidentNumber: "FC-1234",
        Unit: [
          {
            "TimeArrived": "2023-08-30T00:27:14-07:00",
            "TimeAtHospital": "2023-08-30T00:27:14-07:00",
            "TimeDispatched": "2023-08-30T00:27:14-07:00",
            "TimePatient": "2023-08-30Z00:27:14-07:00",
            "TimeTransporting": "2023-08-30T00:27:14-07:00",
          },
          {
            "TimeCleared": "2023-08-29T01:27:14-07:00",
            "TimeEnroute": "2023-08-30T01:27:14-07:00",
            "TimeStaged": undefined,
            "TimeTransport": "2023-08-30T00:27:14-07:00",
          },
        ]
      };
      const {
        delay,
        isHeartBeat,
      } = domain.calculateDelay(heartbeatMessage, atDate, fallback);

      assert.deepEqual(isHeartBeat, false);
      assert.deepEqual(delay, 33);
    });

    it("delay for incident - comment - some time", () => {
      const heartbeatMessage = {
        EntryDateTime: "2023-08-30T00:07:14-07:00",
        IncidentNumber: "FC-1234",
        Comment: [
          {
            "CommentDateTime": "2023-08-30T00:27:14-07:00",
          },
          {
            "CommentDateTime": "2023-08-30T01:27:14-07:00",
          },
        ]
      };
      const {
        delay,
        isHeartBeat,
      } = domain.calculateDelay(heartbeatMessage, atDate, fallback);

      assert.deepEqual(isHeartBeat, false);
      assert.deepEqual(delay, 33);
    });

    it("delay for invalid request is fallback", () => {
      const heartbeatMessage = {
        "tag": "2289cdf9-787a-4317-8097-bc5b0e727b5d",
      };
      const {
        delay,
        isHeartBeat,
      } = domain.calculateDelay(heartbeatMessage, atDate, fallback);

      assert.deepEqual(isHeartBeat, false);
      assert.deepEqual(delay, fallback);
    });

    it("sample", () => {
      const closeMessage = {
        "Interface": "EdgeFrontier Interface by Tablet Command Inc - 0.5 - Incident Close",
        "AgencyID": "PAFD",
        "IncidentNumber": "PFE2306622",
        "TransactionID": "8e757055-3536-4ae7-8838-1998dc64aee1",
        "ClosedDateTime": "",
        "tag": "b9743647-ec12-4f6b-b851-e0040dd20202",
      };
      const {
        delay,
        isHeartBeat,
      } = domain.calculateDelay(closeMessage, atDate, fallback);

      assert.deepEqual(isHeartBeat, false);
      assert.deepEqual(delay, fallback);
    });
  });
});
