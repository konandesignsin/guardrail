import * as core from '@actions/core';
import * as github from '@actions/github';
import { scanFiles } from './core/scanner.js';
import { markdownReport } from './core/reporter.js';
import { scan } from './scan.js';
import { minimatch } from 'minimatch';

const COMMENT_MARKER = '<!-- guardrail-audit-bot -->';

async function run(): Promise<void> {
  try {
    const targetPath = core.getInput('path') || '.';
    const failOn = core.getInput('fail-on') || 'high';
    const shouldComment = core.getInput('comment') !== 'false';
    const token = core.getInput('github-token');
    const ignorePatterns = (core.getInput('ignore') || '').split(',').map((p) => p.trim()).filter(Boolean);

    core.info(`Auditing path: ${targetPath}`);
    core.info(`Ignore patterns: ${ignorePatterns.join(', ')}`);

    let files = await scanFiles(targetPath);

    if (ignorePatterns.length > 0) {
      files = files.filter((file) => !ignorePatterns.some((pattern) => minimatch(file.path, pattern)));
    }

    if (files.length === 0) {
      core.info('No files found to audit.');
      core.setOutput('total-findings', 0);
      core.setOutput('high-count', 0);
      core.setOutput('score', 100);
      return;
    }

    core.info(`Found ${files.length} files to audit.`);

    const { score, findings } = scan(files);

    const highCount = findings.filter((f) => f.severity === 'high').length;
    const mediumCount = findings.filter((f) => f.severity === 'medium').length;
    const lowCount = findings.filter((f) => f.severity === 'low').length;

    core.info(`Found ${findings.length} findings: ${highCount} high, ${mediumCount} medium, ${lowCount} low — score ${score}/100`);

    core.setOutput('total-findings', findings.length);
    core.setOutput('high-count', highCount);
    core.setOutput('score', score);

    const report = markdownReport(findings, files.length, score);

    await core.summary.addRaw(report).write();

    if (shouldComment && token && github.context.eventName === 'pull_request') {
      const octokit = github.getOctokit(token);
      const prNumber = github.context.payload.pull_request?.number;

      if (prNumber) {
        const { data: comments } = await octokit.rest.issues.listComments({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: prNumber,
        });

        const botComment = comments.find(
          (comment) => comment.body?.includes(COMMENT_MARKER),
        );

        const commentBody = `${COMMENT_MARKER}\n${report}`;

        if (botComment) {
          await octokit.rest.issues.updateComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            comment_id: botComment.id,
            body: commentBody,
          });
          core.info('Updated existing PR comment.');
        } else {
          await octokit.rest.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            body: commentBody,
          });
          core.info('Created new PR comment.');
        }
      }
    }

    if (failOn === 'high' && highCount > 0) {
      core.setFailed(`${highCount} high severity finding${highCount === 1 ? '' : 's'} found.`);
    } else if (failOn === 'medium' && (highCount + mediumCount) > 0) {
      core.setFailed(`${highCount + mediumCount} finding${highCount + mediumCount === 1 ? '' : 's'} of medium severity or higher found.`);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
