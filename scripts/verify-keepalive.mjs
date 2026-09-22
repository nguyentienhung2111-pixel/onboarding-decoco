import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../.github/workflows/keepalive.yml', import.meta.url),
  'utf8',
);

assert.match(workflow, /cron: '17 1,9,17 \* \* \*'/);
assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /--connect-timeout 15 --max-time 60 --retry 2 --retry-all-errors/);
assert.match(workflow, /secrets\.SUPABASE_URL/);
assert.match(workflow, /secrets\.SUPABASE_SERVICE_ROLE_KEY/);
assert.match(workflow, /Prefer: resolution=merge-duplicates/);
assert.match(workflow, /if \[ "\$STATUS" -ge 200 \] && \[ "\$STATUS" -lt 300 \]/);

console.log('PASS: keepalive chạy 3 lần/ngày, có timeout/retry và kiểm tra HTTP 2xx.');
