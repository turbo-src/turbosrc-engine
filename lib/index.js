const createPullRequest = require("./createPullRequest");
const createLinkedPullRequest = require("./createLinkedPullRequest");
const updatePullRequest = require("./updatePullRequest");
const createRepo = require("./createRepo");
const getAuthorizedContributor = require("./getAuthorizedContributor");
const getContributorTokenAmount = require("./getContributorTokenAmount");
const getRepoTokenAmount = require("./getRepoTokenAmount");
const getRepoStatus = require("./state/getRepoStatus");
const getPRvoteNoTotals = require("./state/getPRvoteNoTotals");
const getPRvoteYesTotals = require("./state/getPRvoteYesTotals");
const setVote = require("./setVote");
const transferTokens = require("./transferTokens");
const getPullRequest = require("./getPullRequest");
const getMostRecentLinkedPullRequest = require("./getMostRecentLinkedPullRequest");
const getQuorum = require("./state/getQuorum");
const setQuorum = require("./state/setQuorum");
const getPRvoteTotals = require("./state/getPRvoteTotals");
const getRepo = require("./getRepo");
module.exports = {
  createPullRequest,
  createLinkedPullRequest,
  updatePullRequest,
  createRepo,
  getRepo,
  getAuthorizedContributor,
  getContributorTokenAmount,
  getRepoTokenAmount,
  getRepoStatus,
  getPRvoteNoTotals,
  getPRvoteYesTotals,
  setVote,
  transferTokens,
  getPullRequest,
  getMostRecentLinkedPullRequest,
  getQuorum,
  setQuorum,
  getPRvoteTotals,
};
