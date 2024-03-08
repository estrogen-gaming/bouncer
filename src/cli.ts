import { parseArgs } from '@std/cli';
import { resolve as resolvePath } from '@std/path';

import { existsFile } from './utils.ts';
import { parseConfig } from './config.ts';
import { logger } from './logger.ts';

export const run = async () => {
  const args = parseArgs(Deno.args, {
    string: ['config'],
    alias: { c: 'config' },
  });
  let log = await logger();

  let configFilePath = resolvePath(
    (args.config ? args.config : Deno.env.get('CONFIG_FILE')) ??
      'config.yaml',
  );

  if (!await existsFile(configFilePath)) {
    log.error('Configuration file could not be found.');
    return false;
  }

  const config = await parseConfig(configFilePath);
  log = await logger(config.logFolder);

  log.error('Not implemented yet.');

  return;
};
