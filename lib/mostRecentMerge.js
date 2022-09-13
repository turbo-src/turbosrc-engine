const { Repo, PullRequest } = require("../server/db");

async function mostRecentMerge(/*repo:*/ repo_id) {
  try {
    let repo = await Repo.findOne({
      where: { repo_id: repo_id },
      include: {
        model: PullRequest,
        where: {
          status: "merge",
        },
        order: [PullRequest, "updatedAt", "DESC"],
      },
    });

    repo = JSON.stringify(repo, 0, 2);
    const obj = JSON.parse(repo);
    const prs = obj.pullrequests;

    if (prs) {
      return prs[0].pr_id;
    } else {
      return "none";
    }
  } catch (error) {
    console.log(error);
    return 500;
  }
}
module.exports = mostRecentMerge;
