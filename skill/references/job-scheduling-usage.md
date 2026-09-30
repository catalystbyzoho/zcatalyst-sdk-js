# Job Scheduling usage (`@zcatalyst/job-scheduling`)

Node-only job pools, one-off jobs, and cron. Prefer submit/get for runtime use;
create cron only when the user asks.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/job-scheduling@1.0.0
pnpm add --save-exact @zcatalyst/job-scheduling@1.0.0
yarn add --exact @zcatalyst/job-scheduling@1.0.0
```

## Usage

```ts
import { JobScheduling } from '@zcatalyst/job-scheduling';

const scheduling = new JobScheduling(app);

const pool = await scheduling.getJobpool('my_function_pool'); // id or name
const pools = await scheduling.getAllJobpool();

const job = await scheduling.JOB.submitJob({
  job_name: 'send-email',
  target_type: 'Function', // 'Function' | 'Webhook' | 'AppSail' | 'Circuit'
  target_name: 'sendEmail',
  jobpool_name: 'my_function_pool', // or jobpool_id
  params: { to: 'user@example.com' },
});
// job.job_id, job.job_status

await scheduling.JOB.getJob(job.job_id); // id only
await scheduling.JOB.deleteJob(job.job_id);

const cron = await scheduling.CRON.getCron('daily_report'); // id or name
await scheduling.CRON.getAllCron();
await scheduling.CRON.pauseCron('daily_report');
await scheduling.CRON.resumeCron('daily_report');
await scheduling.CRON.runCron('daily_report');
```

### `submitJob` by `target_type`

| target_type | Extra fields |
|-------------|--------------|
| `Function` | `target_id?`, `target_name?`, `params?` |
| `Webhook` | `url`, `request_method`, `params?`, `headers?`, `request_body?` |
| `AppSail` | `target_id?`, `target_name?`, `url?`, `request_method`, … |
| `Circuit` | `target_id?`, `target_name?`, **`test_cases`** (required) |

Shared: `job_name`, optional `job_config.{number_of_retries,retry_interval}`,
`jobpool_id` / `jobpool_name`.

### Cron create (only if user asks)

Needs `cron_name`, `cron_status`, `cron_type`
(`OneTime` | `Periodic` | `Calendar` | `CronExpression`), `cron_detail`, `job_meta`.

## Pitfalls

- IDs/names: alphanumeric + `-` / `_` only.
- Response fields are snake_case (`job_id`, `job_status`, `cron_name`).
- Do not invent pool/function names — use existing project resources.
