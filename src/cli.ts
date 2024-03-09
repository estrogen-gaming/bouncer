import { parseArgs } from '@std/cli';
import { resolve as resolvePath } from '@std/path';

import { existsPath } from './utils.ts';
import { parseConfig } from './config.ts';
import { customLogger } from './logger.ts';
import { startBot } from './bot/index.ts';
import { setupDatabase } from './database.ts';

export const runCLI = async () => {
  const args = parseArgs(Deno.args, {
    string: ['config'],
    alias: { c: 'config' },
  });
  let logger = await customLogger();

  const configFilePath = resolvePath(
    (args.config ? args.config : Deno.env.get('CONFIG_FILE')) ??
      'config.yaml',
  );

  if (!await existsPath(configFilePath)) {
    logger.error('Configuration file could not be found.');
    return false;
  }

  const config = await parseConfig(configFilePath);

  if (config.logFolder) {
    logger = await customLogger(config.logFolder);
  }

  const database = await setupDatabase(config.database);

  await startBot(database, config.discord, logger);

  return;
};
