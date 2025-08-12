import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'node:fs';

const webhook = process.env.SLACK_WEBHOOK_URL!;
if (!webhook) {
  console.error('SLACK_WEBHOOK_URL missing');
  process.exit(1);
}

function summarizeDrift(): string {
  const p = 'docs/rbac_drift_report.md';
  if (!fs.existsSync(p)) return 'No drift report found.';
  const txt = fs.readFileSync(p, 'utf8');
  const p0 = /Used in code but NOT seeded[\s\S]*?^- /m.test(txt)
    ? '⚠️ check list'
    : /Used in code but NOT seeded:\s*0/.test(txt)
      ? '0'
      : '0?';
  return `Drift P0: ${p0}`;
}

async function post(text: string) {
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

(async () => {
  const drift = summarizeDrift();
  const env =
    process.env.GITHUB_REF || process.env.VERCEL_GIT_COMMIT_REF || 'local';
  const status = drift.includes('0') ? '🟢' : '🔴';
  await post(`${status} RBAC check (${env}): ${drift}
- Guard Lint: ${process.env.RBAC_LINT_STATUS || 'see artifact'}
- Tests: ${process.env.RBAC_TEST_STATUS || 'see artifact'}`);
})();
