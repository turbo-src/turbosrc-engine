const assert = require("assert");
const { mostRecentMerge } = require("../src/requests");

describe("mostRecentMerge", function () {
  it("should return the pr_id of the most recently merged pull request for a repo", async function () {
    const res = await mostRecentMerge(/*repo:*/ "joseph/demo");

    assert.equal(
      res,
      "pullRequest1",
      "Failed to return the most recently merge pull request"
    );
  });
});
