const { Repo, PullRequest, Vote } = require('../server/db')
const getVotePowerAmount = require('./getVotePowerAmount')
const updatePullRequest = require('./updatePullRequest')

async function setVote(
    /*owner:*/ owner,
    /*repo:*/ repo_id,
    /*defaultHash:*/ defaultHash,
    /*childDefaultHash:*/ childDefaultHash,
    /*mergeable:*/ mergeable,
    /*contributor_id:*/ contributor_id,
    /*side:*/ side,
) {
    try {
        if (!mergeable) {
            return 403
        }
        // Ensure token.status returns a 200
        // and token.amount > 0.
        let pullRequest = await PullRequest.findOne({
            where: { defaultHash: defaultHash, repo_id: repo_id },
        })

        if (!pullRequest) {
            console.log('pull request doesn\'t exist')
            return 404 //Not found
        }

        if (defaultHash !== childDefaultHash) {
            // Update of merge hash and mergeable state.
            const upRes = await updatePullRequest(
                repo_id,
                defaultHash,
                childDefaultHash,
                mergeable,
            )
            if (upRes === 201) {
                // get new instance of pull request after above update
                pullRequest = await PullRequest.findOne({
                    where: { defaultHash: defaultHash, repo_id: repo_id },
                })
            } else {
                return 403 // Appropriate status code?
            }
        }

        // Only vote on new or open pull requests.
        const voteable =
      pullRequest.state === 'open' ||
      pullRequest.state === 'pre-open' ||
      pullRequest.state === 'update' ||
      pullRequest.state === 'vote'
        if (!voteable) {
            return 403 // Appropriate status code?
        }

        const duplicateVote = await Vote.findOne({
            where: { defaultHash: defaultHash, contributor_id: contributor_id },
        })

        if (duplicateVote) {
            console.log('duplicate')
            return 403
        } else {
            let tokens = await getVotePowerAmount(
                /*owner:*/ '',
                /*repo:*/ repo_id,
                /*defaultHash:*/ defaultHash,
                /*contributor_id:*/ contributor_id,
                /*side:*/ '',
            )

            // Should also check if tokens.status === 404
            if (tokens.amount < 1) {
                return 403
            }

            let vote = await Vote.create({
                contributor_id: contributor_id,
                defaultHash: defaultHash,
                votePower: tokens.amount,
                side: side,
            })

            await vote.setPullrequest(pullRequest.id)

            if (side === 'yes') {
                let newTotal = pullRequest.yesTokenAmount + tokens.amount
                await pullRequest.update({
                    yesTokenAmount: newTotal,
                    where: { id: pullRequest.id },
                })
            }
            if (side === 'no') {
                let newTotal = pullRequest.noTokenAmount + tokens.amount
                await pullRequest.update({
                    noTokenAmount: newTotal,
                    where: { id: pullRequest.id },
                })
            }

            return 201
        }
    } catch (error) {
        console.log(error)
        return 500
    }
}

module.exports = setVote
