import { parseArgs } from '@std/cli';
import { resolve as resolvePath } from '@std/path';

import { existsFile } from './utils.ts';
import { logger } from './logger.ts';

export const run = async () => {
  const args = parseArgs(Deno.args, {
    string: ['config'],
    alias: { c: 'config' },
  });

  let configFilePath = resolvePath(
    (args.config ? args.config : Deno.env.get('CONFIG_FILE')) ??
      'config.yaml',
  );

  if (!await existsFile(configFilePath)) {
    logger.error('Configuration file could not be found.');
    return false;
  }

  console.log(args);
};
