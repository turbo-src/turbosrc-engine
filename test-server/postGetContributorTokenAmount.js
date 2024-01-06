const assert = require("assert");
const { postGetContributorTokenAmount } = require("../src/requests");

describe("postGetContributorTokenAmount", function () {
  it("should return the number of tokens a contributor has for a repo", async function () {
    let resMichaelTokenAmount = await postGetContributorTokenAmount(
      /*owner:*/ "",
      /*repo:*/ "joseph/demo",
      /*defaultHash:*/ "",
      /*contributor:*/ "0x0c55D3B26A1229B9D707a4272F55E66103301858",
      /*side:*/ ""
    );

    assert.deepEqual(
      resMichaelTokenAmount,
      { status: 200, amount: 50_000 },
      "Failed to get contributor token amount"
    );
  });
});
