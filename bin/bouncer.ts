if (import.meta.main) {
  const { run } = await import('../src/cli.ts');

  await run();
}
