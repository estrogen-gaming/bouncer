#!/usr/bin/env -S deno run --allow-env=CONFIG_FILE,DEBUG --allow-read --allow-write

if (import.meta.main) {
  const { runCLI } = await import('../src/cli.ts');

  await runCLI();
}
