const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const { db } = require("./db");
require("dotenv").config();

const {
  createPullRequest,
  createRepo,
  getAuthorizedContributor,
  transferTokens,
  getContributorTokenAmount,
  getPRvoteStatus,
  getRepoStatus,
  getPRvoteTotals,
  getPRvoteYesTotals,
  getPRvoteNoTotals,
  setQuorum,
  getQuorum,
  setVote,
  mostRecentMerge,
} = require("../lib");

var schema = buildSchema(`
  type RepoStatus {
    status: Int!
    exists: Boolean!
  }

  type PRvoteStatus {
    status: Int!
    type: Int!
  }

  type ContributorTokenAmount {
    status: Int!
    amount: Int!
  }

  type Query {
    createRepo(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    createPullRequest(owner: String, repo: String, pr_id: String, fork_branch: String, title: String): String,
    getRepoStatus(repo_id: String): RepoStatus,
    getAuthorizedContributor(contributor_id: String, repo_id: String): Boolean,
    getContributorTokenAmount(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): ContributorTokenAmount,
    transferTokens(owner: String, repo: String, from: String, to: String, amount: String): String,
    setVote(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteStatus(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): PRvoteStatus,
    setQuorum(repo: String, contributor_id: String, quorum: String): String,
    getQuorum(repo: String): String,
    getPRvoteTotals(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteYesTotals(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    getPRvoteNoTotals(owner: String, repo: String, pr_id: String, contributor_id: String, side: String): String,
    mostRecentMerge(repo: String): String
  }
`);

var root = {
  createRepo: async (args) => {
    return await createRepo(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  createPullRequest: async (args) => {
    return await createPullRequest(
      args.owner,
      args.repo,
      args.pr_id,
      args.fork_branch,
      args.title
    );
  },
  getRepoStatus: async (args) => {
    const res = await getRepoStatus(args.repo_id);
    if (res === true) {
      return { status: 200, exists: true };
    } else if (res === false) {
      return { status: 200, exists: false };
    } else if (res === 404) {
      return { status: 404, exists: false };
    } else {
      return { status: 500, exists: false };
    }
  },
  getAuthorizedContributor: async (args) => {
    return await getAuthorizedContributor(args.contributor_id, args.repo_id);
  },
  getContributorTokenAmount: async (args) => {
    return await getContributorTokenAmount(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  transferTokens: async (args) => {
    return await transferTokens(
      args.owner,
      args.repo,
      args.from,
      args.to,
      args.amount
    );
  },
  setVote: async (args) => {
    // Ensure token.status returns a 200
    // and token.amount > 0.
    // May want to incorporate all the into getAuthorizedContributor.
    // Probably not best to check in lib/setVote.js
    // for module encapsulation.
    return await setVote(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  getPRvoteStatus: async (args) => {
    return await getPRvoteStatus(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  setQuorum: async (args) => {
    return await setQuorum(args.repo, args.contributor_id, args.quorum);
  },
  getQuorum: async (args) => {
    return await getQuorum(args.repo);
  },
  getPRvoteTotals: async (args) => {
    return getPRvoteTotals(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  getPRvoteYesTotals: async (args) => {
    return getPRvoteYesTotals(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  getPRvoteNoTotals: async (args) => {
    return getPRvoteNoTotals(
      args.owner,
      args.repo,
      args.pr_id,
      args.contributor_id,
      args.side
    );
  },
  mostRecentMerge: async (args) => {
    return mostRecentMerge(args.repo);
  },
};

const port = 4002;

const app = express();

app.listen(port, "0.0.0.0");
console.log(`Running an Express-GraphQL server on port ${port}`);

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

try {
  //Will delete data from db every time with force: true
  db.sync({ force: true });
  db.authenticate();
  console.log(
    "Connection to the Postgres database has been established successfully."
  );
} catch (error) {
  console.error("Unable to connect to the Postgres database:", error);
}
