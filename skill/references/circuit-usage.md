# Circuit usage (`@zcatalyst/circuit`)

Node-only circuit execution. Assume the circuit is already published.

## Install

```bash
# use the project package manager; pin exact 1.0.0
npm install --save-exact @zcatalyst/circuit@1.0.0
pnpm add --save-exact @zcatalyst/circuit@1.0.0
yarn add --exact @zcatalyst/circuit@1.0.0
```

## Usage

Param order is **circuitId, executionName, input** (not name-first).

```ts
import { Circuit } from '@zcatalyst/circuit';

const circuit = new Circuit(app);

const exe = (await circuit.execute('195000000041001', 'daily_sync', {
  accountId: 'abc123', // values typed as strings
})) as {
  id: string; // execution id — use for status/abort
  status: string;
  output: unknown;
  circuit_name?: string;
};

await circuit.status('195000000041001', exe.id); // exeId must be a string
await circuit.abort('195000000041001', exe.id);
```

Execute body on the wire: `{ name, input }`. Returns unwrapped execution object
(`id`, `status`, `input`, `output`, …).

## Pitfalls

- Input map values should be **strings**.
- Pass `exe.id` as a string to `status` / `abort` (numbers fail validation).
- Do not invent circuit ids.
