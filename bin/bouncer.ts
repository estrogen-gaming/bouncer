#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write --unstable-kv

if (import.meta.main) {
  const { runCLI } = await import('../src/cli.ts');

  await runCLI();
}
