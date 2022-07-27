const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const superagent = require("superagent");

import {
  createPullRequest,
  createRepo,
  createUser,
  getAuthorizedContributor,
  getContributorID,
  getContributorName,
  getContributorTokenAmount,
  getPrStatus,
  getRepoTokenAmount,
} from "../lib/index.js";

import {
  getPullRequest,
  createPullRequest,
  closePullRequest,
  mergePullRequest,
  fork,
} from "../utils/gitHubUtil.js";

var schema = buildSchema(`
  type PullRequest {
    vote_code: [String]
  }
  type Query {
    getContributorTokenAmount(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    createUser(owner: String, repo: String, contributor_id: String, contributor_name: String, contributor_signature: String): String,
    getContributorName(owner: String, repo: String, pr_id: String, contributor_id: String): String,
    getContributorID(owner: String, repo: String, pr_id: String, contributor_name: String): String,
    getContributorSignature(owner: String, repo: String, pr_id: String, contributor_id: String): String,
    transferTokens(owner: String, repo: String, from: String, to: String, amount: String): String,
    pullFork(owner: String, repo: String, pr_id: String, contributor_id: String): String,
    getPRforkStatus(owner: String, repo: String, pr_id: String, contributor_id: String): String,
    getVote(pr_id: String, contributor_id: String): String,
    getVoteAll(pr_id: String): PullRequest,
    getVoteEverything: String,
    setVote(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    createRepo(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    newPullRequest(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteStatus(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteTotals(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteYesTotals(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteNoTotals(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getRepoStatus(repo_id: String): Boolean,
    getAuthorizedContributor(contributor_id: String, repo_id: String): Boolean,
    verifyPullRequest(pr_id: String): String,
    createPullRequest(owner: String, repo: String, fork_branch: String, pr_id: String, title: String): String,
    closePullRequest(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    mergePullRequest(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    fork(owner: String, repo: String, org: String): String,
  }
`);

// root 'method' for query.
var root = {
  createUser: async (args) => {
    return await createUser(args);
  },
  getContributorName: async (args) => {
    return await getContributorName(args);
  },
  getContributorID: async (args) => {
    return await getContributorID(args);
  },
  getContributorSignature: async (args) => {
    return await getContributorSignature;
  },
  getContributorTokenAmount: async (args) => {
    return await getContributorTokenAmount(args);
  },
  transferTokens: async (args) => {
    return await transferTokens(args);
  },
  verifyPullRequest: async (arg) => {
    // Check if it's in our database
    // If not, fetch it.
    // redis.get(sha256)
    //return status
    //return fakeTurboSrcReposDB.includes(arg.repo_id)
  },
  getRepoStatus: async (args) => {
    const status = getRepoStatus(fakeTurboSrcReposDB, args);

    return status;
  },
  getAuthorizedContributor: async (args) => {
    console.log(args.repo_id);
    console.log(args.contributor_id);
    const contributor_exists = checkContributor(fakeTurboSrcReposDB, args);
    return contributor_exists;
  },
  getVoteAll: async (pr_id) => {
    return pullRequestsDB[pr_id];
  },
  getVoteEverything: async () => {
    return JSON.stringify(pullRequestsDB);
  },
  getPRvoteStatus: async (args) => {
    var status = getPRvoteStatus(fakeTurboSrcReposDB, args);
    if (status === "open" || status === "none") {
      const prID = args.pr_id.split("_")[1];
      const closeRes = checkRejectPullRequestHistory(
        pullRequestsVoteCloseHistory,
        args
      );
      if (closeRes) {
        status = "closed";
      }

      const mergeRes = checkMergePullRequestHistory(
        pullRequestsVoteMergeHistory,
        args
      );

      if (mergeRes) {
        status = "merge";
      }
    }

    return status;
  },
  getPRpercentVotedQuorum: async (args) => {
    const voteTotals = getPRvoteTotals(fakeTurboSrcReposDB, args);
    return voteTotals.percentVotedQuorum;
  },
  getPRvoteYesTotals: async (args) => {
    const voteTotals = getPRvoteTotals(fakeTurboSrcReposDB, args);
    return voteTotals.totalVotedYesTokens;
    //return voteTotals.percentVotedQuorum
  },
  getPRvoteNoTotals: async (args) => {
    const voteTotals = getPRvoteTotals(fakeTurboSrcReposDB, args);
    return voteTotals.totalVotedNoTokens;
    //return voteTotals.percentVotedQuorum
  },
  getPRvoteTotals: async (args) => {
    const voteTotals = getPRvoteTotals(fakeTurboSrcReposDB, args);
    //return voteTotals.totalVotedTokens
    return voteTotals.percentVotedQuorum;
  },
  getPRforkStatus: async (args) => {
    var res;
    const prID = args.pr_id.split("_")[1];
    // User should do this instead and pass it in request so we don't overuse our github api.
    console.log("owner " + args.owner);
    console.log("repo " + args.repo);
    console.log("pr_id " + prID);
    var baseRepoName = args.repo;
    var baseRepoOwner = args.owner;
    console.log(args.owner);
    console.log(baseRepoOwner);
    console.log(prID);
    var resGetPR = await getPullRequest(baseRepoOwner, baseRepoName, prID);
    console.log(resGetPR);
    var pullReqRepoHead = await gitHeadUtil(
      resGetPR.contributor,
      baseRepoName,
      resGetPR.forkBranch,
      0
    );
    const baseDir = "repos/" + args.repo;
    const pullForkDir = baseDir + "/" + pullReqRepoHead;

    console.log("pullReqRepoHead " + pullReqRepoHead);

    // 404 means the repo doesn't exist on github, per api call.
    if (resGetPR !== 404 && pullReqRepoHead !== 404) {
      // Check if there is already a dir for the pull fork.
      if (!fs.existsSync(pullForkDir)) {
        res = "pull";
        console.log("pull");
      } else {
        res = "valid";
        console.log("valid");
      }
    } else {
      res = "notOnGithub";
      console.log("notOnGithub");
    }
    console.log("final result");
    console.log(res);
    return res;
  },
  pullFork: async (args) => {
    superagent
      .post("http://localhost:4001/graphql")
      .send({
        query: `{ getPRfork(owner: "${args.owner}", repo: "${args.repo}", pr_id: "${args.pr_id}", contributor_id: "${args.contributor_id}") }`,
      }) // sends a JSON post body
      .set("accept", "json")
      .end((err, res) => {
        // Calling the end function will send the request
      });
    return "something";
  },
  setVote: async (args) => {
    // Check user votes. If voted, don't set vote.
    debugger;
    const votedTokens = getPRvote(fakeTurboSrcReposDB, args);
    if (votedTokens > 0) {
      return "duplicate";
    } else if (typeof votedTokens === "undefined") {
      // If vote not open, open it.
      const voteStatus = await getPRvoteStatus(fakeTurboSrcReposDB, args);
      if (voteStatus === "none") {
        const numberActivePullRequests = getActivePullRequestsCount(
          fakeTurboSrcReposDB,
          args
        );

        //Fix: shouldn't make state changes in status check.

        // Only allow to open the pull request for vote
        // if there is no other active vote.
        if (numberActivePullRequests === 0) {
          const resNewPullRequest = await newPullRequest(args);
        }
      }

      const resultSetVote = await setVote(args);

      fakeTurboSrcReposDB = resultSetVote.db;
      return resultSetVote.prVoteStatus;
    }
  },
  newPullRequest: async (args) => {
    const resNewPullRequest = await newPullRequest(args);

    fakeTurboSrcReposDB = resNewPullRequest.db;
    pullRequestsDB = resNewPullRequest.pullRequestsDB;

    return pullRequestsDB[args.pr_id];
  },
  createRepo: async (args) => {
    var contributors = getContributorsByContributorID(
      nameSpaceDB.contributors,
      args.contributor_id
    );
    if (contributors.length == 1) {
      const resCreateRepo = await createRepo(
        fakeTurboSrcReposDB,
        pullRequestsDB,
        args
      );
      fakeTurboSrcReposDB = resCreateRepo.db;
      pullRequestsDB = resCreateRepo.pullRequestsDB;
      return pullRequestsDB[args.pr_id];
    } else {
      return "none";
    }
  },
};

var app = express();
//app.use(loggingMiddleware);
app.use(cors());
app.use(function (req, res, next) {
  let originalSend = res.send;
  res.send = function (data) {
    console.log(data + "\n");
    originalSend.apply(res, Array.from(arguments));
  };
  next();
});
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
var way = false;
//if (way === true) {
//     console.log("true");
//     return true;
//   } else {
//     console.log("false");
//     return false;
//}
app.listen(8080);
console.log("Running a GraphQL API server at localhost:4000/graphql");
