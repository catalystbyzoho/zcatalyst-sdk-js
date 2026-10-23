# Pipelines usage (`@zcatalyst/pipelines`)

Node-only pipeline details and runs. npm name is `@zcatalyst/pipelines`
(not `@zcatalyst/pipeline`).

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/pipelines@1.0.0
pnpm add --save-exact @zcatalyst/pipelines@1.0.0
yarn add --exact @zcatalyst/pipelines@1.0.0
```

## Usage

```ts
import { Pipelines } from '@zcatalyst/pipelines';

const pipelines = new Pipelines(app);

const details = await pipelines.getPipelineDetails('1234');
// details.pipeline_id, details.name, details.pipeline_status, details.env_variables

const run = await pipelines.runPipeline('1234', 'main', {
  NODE_ENV: 'production',
});
// run.history_id, run.pipeline_id, run.history_status, run.event_time
```

`runPipeline(pipelineId, branch?, envVariables?)` — branch is a query param;
env map becomes the JSON body (`{}` if omitted).

## Pitfalls

- Assume the pipeline id already exists.
- Focus on get/run — not CI setup or repo linking.
