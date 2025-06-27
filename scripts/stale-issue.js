const core = require('@actions/core');
const github = require('@actions/github');
const dateformat = require('dateformat');

const MS_PER_DAY = 86400000;

function isLabeled(issue, label) {
  if ('labels' in issue) {
    const foundone = issue.labels.some((labelObj) => {
      if (typeof labelObj === 'string') {
        return labelObj === label;
      }
      return labelObj.name === label;
    });
    if (foundone) {
      core.debug(`issue has label ${label}`);
    } else {
      core.debug(`issue doesn't have label ${label}`);
    }
    return foundone;
  }
  core.debug(`no labels detail in #${issue}`);
  return false;
}

function revCompareEventsByDate(a, b) {
  if ('created_at' in a && 'created_at' in b) {
    const dateA = Date.parse(a.created_at);
    const dateB = Date.parse(b.created_at);
    if (dateA < dateB) {
      return 1;
    }
    if (dateA === dateB) {
      return 0;
    }
    return -1;
  }
  return 0;
}

function getLastLabelTime(events, label) {
  const labelEvents = events.filter((event) => event.event === 'labeled');
  const searchedLabelEvents = labelEvents.filter((event) => {
    if ('label' in event) {
      return event.label.name === label;
    }
    return false;
  });
  const validLabelEvents = searchedLabelEvents.filter(
    (event) => 'created_at' in event
  );
  if (validLabelEvents.length > 0) {
    validLabelEvents.sort(revCompareEventsByDate);
    return new Date(Date.parse(validLabelEvents[0].created_at));
  }
  core.info(`Could not find a ${label} label event in this issue's timeline. Was this label renamed?`);
  return undefined;
}

function getLastCommentTime(events) {
  const commentEvents = events.filter((event) => event.event === 'commented');
  if (commentEvents.length > 0) {
    core.debug('issue has comments');
    commentEvents.sort(revCompareEventsByDate);
    if ('created_at' in commentEvents[0]) {
      return new Date(Date.parse(commentEvents[0].created_at));
    }
  }
  // No comments on issue, so use *all events*
  core.debug('issue has no comments');
  events.sort(revCompareEventsByDate);
  if ('created_at' in events[0]) {
    return new Date(Date.parse(events[0].created_at));
  }
  return undefined;
}

function asyncForEach(_array, _callback) {
  throw new Error('Use Promise.all or Promise.allSettled instead');
}

function dateFormatToIsoUtc(dateTime) {
  return dateformat(dateTime, 'isoUtcDateTime');
}

function parseCommaSeparatedString(s) {
  if (!s.length) return [];
  return s.split(',').map((e) => e.trim());
}

async function closeIssue(client, issue, cfsLabel) {
  core.debug(`closing issue #${issue.number} for staleness`);
  if (cfsLabel && cfsLabel !== '') {
    await client.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issue.number,
      labels: [cfsLabel],
    });
  }
  await client.rest.issues.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    state: 'closed',
  });
}

async function removeLabel(client, issue, label) {
  core.debug(`removing label ${label} from issue #${issue.number}`);
  await client.rest.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    name: label,
  });
}

async function markStale(client, issue, staleMessage, staleLabel) {
  core.debug(`marking issue #${issue.number} as stale`);
  await client.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    body: staleMessage,
  });
  await client.rest.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue.number,
    labels: [staleLabel],
  });
}

async function getTimelineEvents(client, issue) {
  return client.paginate(client.rest.issues.listEventsForTimeline, {
    issue_number: issue.number,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    per_page: 100,
  });
}

async function getIssues(client, args) {
  const responseIssues = await client.paginate(client.rest.issues.listForRepo, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    state: 'open',
    labels: args.responseRequestedLabel,
    per_page: 100,
  });
  core.debug(`found ${responseIssues.length} response-requested issues`);

  const staleIssues = [];
  if (args.staleIssueMessage && args.staleIssueMessage !== '') {
    staleIssues.push(
      ...(await client.paginate(client.rest.issues.listForRepo, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        state: 'open',
        labels: args.staleIssueLabel,
        per_page: 100,
      }))
    );
    core.debug(`found ${staleIssues.length} stale issues`);
  } else {
    core.debug('skipping stale issues due to empty message');
  }

  const stalePrs = [];
  if (args.stalePrMessage && args.stalePrMessage !== '') {
    stalePrs.push(
      ...(await client.paginate(client.rest.issues.listForRepo, {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        state: 'open',
        labels: args.stalePrLabel,
        per_page: 100,
      }))
    );
    core.debug(`found ${stalePrs.length} stale PRs`);
  } else {
    core.debug('skipping stale PRs due to empty message');
  }

  const ancientIssues = [];
  if (args.ancientIssueMessage && args.ancientIssueMessage !== '') {
    core.debug(
      `using issue ${args.useCreatedDateForAncient ? 'created date' : 'last updated'} to determine for getting ancient issues.`
    );
    const ancientResults = await client.paginate(client.rest.issues.listForRepo, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      state: 'open',
      per_page: 100,
      sort: 'updated',
      direction: 'asc',
    });
    ancientResults
      .filter(
        (issue) =>
          (args.useCreatedDateForAncient ? new Date(issue.created_at) : new Date(issue.updated_at)) <
          new Date(Date.now() - MS_PER_DAY * args.daysBeforeAncient)
      )
      .map((i) => ancientIssues.push(i));
    core.debug(`found ${ancientIssues.length} ancient issues`);
  } else {
    core.debug('skipping ancient issues due to empty message');
  }

  const issues = [...responseIssues, ...staleIssues, ...stalePrs, ...ancientIssues];
  // Dedupe issues based on id
  const ids = new Set();
  return issues.filter((issue) => (ids.has(issue.id) ? false : ids.add(issue.id)));
}

async function hasEnoughUpvotes(client, issueNumber, upvoteCount) {
  const reactions = await client.paginate(client.rest.reactions.listForIssue, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  const upvotes = reactions.filter(
    (reaction) =>
      reaction.content === '+1' ||
      reaction.content === 'heart' ||
      reaction.content === 'hooray' ||
      reaction.content === 'rocket'
  ).length;
  return upvotes >= upvoteCount;
}

function getRequiredInput(name) {
  return core.getInput(name, { required: true });
}
function getNumberInput(name) {
  return Number.parseFloat(core.getInput(name));
}
function getOptionalBooleanInput(name) {
  return core.getInput(name, { required: false }).toLowerCase() === 'true';
}

function getAndValidateInputs() {
  const args = {
    repoToken: getRequiredInput('repo-token'),
    ancientIssueMessage: core.getInput('ancient-issue-message'),
    ancientPrMessage: core.getInput('ancient-pr-message'),
    staleIssueMessage: core.getInput('stale-issue-message'),
    stalePrMessage: core.getInput('stale-pr-message'),
    daysBeforeStale: getNumberInput('days-before-stale'),
    daysBeforeClose: getNumberInput('days-before-close'),
    daysBeforeAncient: getNumberInput('days-before-ancient'),
    staleIssueLabel: core.getInput('stale-issue-label'),
    exemptIssueLabels: core.getInput('exempt-issue-labels'),
    stalePrLabel: core.getInput('stale-pr-label'),
    exemptPrLabels: core.getInput('exempt-pr-labels'),
    cfsLabel: core.getInput('closed-for-staleness-label'),
    issueTypes: core.getInput('issue-types').split(','),
    responseRequestedLabel: core.getInput('response-requested-label'),
    minimumUpvotesToExempt: getNumberInput('minimum-upvotes-to-exempt'),
    dryrun: getOptionalBooleanInput('dry-run'),
    useCreatedDateForAncient: getOptionalBooleanInput('use-created-date-for-ancient'),
  };

  for (const numberInput of [args.daysBeforeAncient, args.daysBeforeClose, args.daysBeforeStale]) {
    if (Number.isNaN(numberInput)) {
      throw Error(`input ${numberInput} did not parse to a valid integer`);
    }
  }

  return args;
}

async function processIssues(client, args) {
  const uniqueIssues = await getIssues(client, args);

  await Promise.all(uniqueIssues.map(async (issue) => {
    core.debug('==================================================');
    core.debug(`ISSUE #${issue.number}: ${issue.title}`);
    core.debug(`last updated ${issue.updated_at}`);
    const isPr = 'pull_request' in issue;
    const skipPullRequests = args.issueTypes.indexOf('pull_requests') === -1;
    const skipIssues = args.issueTypes.indexOf('issues') === -1;

    if (isPr && skipPullRequests) {
      core.debug('Issue is a pull request, which are excluded');
      return;
    }

    if (!isPr && skipIssues) {
      core.debug('Issue is an issue, which are excluded');
      return;
    }

    const staleMessage = isPr ? args.stalePrMessage : args.staleIssueMessage;
    const ancientMessage = isPr ? args.ancientPrMessage : args.ancientIssueMessage;

    const staleLabel = isPr ? args.stalePrLabel : args.staleIssueLabel;
    const exemptLabels = parseCommaSeparatedString(isPr ? args.exemptPrLabels : args.exemptIssueLabels);
    const responseRequestedLabel = args.responseRequestedLabel;

    const issueTimelineEvents = await getTimelineEvents(client, issue);

    const currentTime = new Date(Date.now());

    if (exemptLabels?.some((s) => isLabeled(issue, s))) {
      core.debug('issue contains exempt label');
      return;
    }

    if (isLabeled(issue, staleLabel)) {
      core.debug('issue contains the stale label');

      const commentTime = getLastCommentTime(issueTimelineEvents);
      const lastCommentTime = commentTime ? commentTime.getTime() : 0;

      const staleLabelTime = getLastLabelTime(issueTimelineEvents, staleLabel)?.getTime();
      const sTime = new Date(lastCommentTime + MS_PER_DAY * args.daysBeforeClose);

      if (staleLabelTime === undefined) {
        core.warning('Skipping this issue');
        return;
      }

      if (lastCommentTime > staleLabelTime) {
        core.debug('issue was commented on after the label was applied');
        if (args.dryrun) {
          core.info(`dry run: would remove ${staleLabel} and ${responseRequestedLabel} labels for #${issue.number}`);
        } else {
          await removeLabel(client, issue, staleLabel);
          if (isLabeled(issue, responseRequestedLabel)) {
            await removeLabel(client, issue, responseRequestedLabel);
          }
        }
      } else {
        if (currentTime > sTime) {
          core.debug('time expired on this issue, need to close it');
          if (args.dryrun) {
            core.info(`dry run: would remove ${staleLabel} for #${issue.number} and close`);
          } else {
            await removeLabel(client, issue, staleLabel);
            await closeIssue(client, issue, args.cfsLabel);
          }
        } else {
          core.debug(`${dateFormatToIsoUtc(currentTime)} is less than ${dateFormatToIsoUtc(sTime)}, doing nothing`);
        }
      }
    } else if (isLabeled(issue, responseRequestedLabel)) {
      const commentTime = getLastCommentTime(issueTimelineEvents);
      const lastCommentTime = commentTime ? commentTime.getTime() : 0;

      const rrLabelTime = getLastLabelTime(issueTimelineEvents, responseRequestedLabel);
      const rrLabelTimeMilliseconds = rrLabelTime ? rrLabelTime.getTime() : 0;

      const rrTime = new Date(lastCommentTime + MS_PER_DAY * args.daysBeforeStale);
      if (lastCommentTime > rrLabelTimeMilliseconds) {
        core.debug('issue was commented on after the label was applied');
        if (args.dryrun) {
          core.info(`dry run: would remove ${responseRequestedLabel} from #${issue.number}`);
        } else {
          await removeLabel(client, issue, responseRequestedLabel);
        }
      } else {
        if (currentTime >= rrTime) {
          if (staleMessage && staleMessage !== '') {
            core.debug('time expired on this issue, need to label it stale');
            if (args.dryrun) {
              core.info(`dry run: would mark #${issue.number} as ${staleLabel} due to ${responseRequestedLabel} age`);
            } else {
              await markStale(client, issue, staleMessage, staleLabel);
            }
          } else {
            core.debug('stale message is null/empty, doing nothing');
          }
        } else {
          core.debug('issue is not stale yet');
          core.debug(`${dateFormatToIsoUtc(currentTime)} is less than ${dateFormatToIsoUtc(rrTime)}, doing nothing`);
        }
      }
    } else {
      const dateToCompare = args.useCreatedDateForAncient ? Date.parse(issue.created_at) : Date.parse(issue.updated_at);
      core.debug(
        `using issue ${args.useCreatedDateForAncient ? 'created date' : 'last updated'} to determine if the issue is ancient.`
      );
      if (dateToCompare < new Date(Date.now() - MS_PER_DAY * args.daysBeforeAncient).getTime()) {
        if (typeof args.minimumUpvotesToExempt !== 'undefined') {
          if (await hasEnoughUpvotes(client, issue.number, args.minimumUpvotesToExempt)) {
            core.debug('issue is ancient but has enough upvotes to exempt');
          } else {
            core.debug('issue is ancient and not enough upvotes; marking stale');
            if (ancientMessage && ancientMessage !== '') {
              if (args.dryrun) {
                core.info(
                  `dry run: would mark #${issue.number} as ${staleLabel} due to ${args.useCreatedDateForAncient ? 'created date' : 'last updated'} age`
                );
              } else {
                await markStale(client, issue, ancientMessage, staleLabel);
              }
            } else {
              core.debug('ancient message is null/empty, doing nothing');
            }
          }
        } else {
          core.debug('issue is ancient and not enough upvotes; marking stale');
          if (ancientMessage && ancientMessage !== '') {
            if (args.dryrun) {
              core.info(
                `dry run: would mark #${issue.number} as ${staleLabel} due to ${args.useCreatedDateForAncient ? 'created date' : 'last updated'} age`
              );
            } else {
              await markStale(client, issue, ancientMessage, staleLabel);
            }
          } else {
            core.debug('ancient message is null/empty, doing nothing');
          }
        }
      }
    }
  }));
}

async function run(fetchImpl) {
  try {
    core.info('Starting issue processing');
    const args = getAndValidateInputs();
    core.debug(JSON.stringify(args, null, 2));
    const client = github.getOctokit(args.repoToken, { request: { fetch: fetchImpl || globalThis.fetch } });
    await processIssues(client, args);
    core.info('Labelled issue processing complete');
    process.exitCode = 0;
  } catch (e) {
    core.error(`failed to run action: ${e}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  isLabeled,
  revCompareEventsByDate,
  getLastLabelTime,
  getLastCommentTime,
  asyncForEach,
  dateFormatToIsoUtc,
  parseCommaSeparatedString,
  closeIssue,
  removeLabel,
  markStale,
  getTimelineEvents,
  getIssues,
  hasEnoughUpvotes,
  getAndValidateInputs,
  processIssues,
  run
};