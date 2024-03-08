import * as log from '@std/log';
import { format as formatDate } from '@std/datetime';
import { blue, gray, green, red, yellow } from '@std/fmt/colors';

const LevelNames = {
  INFO: `  INFO `,
  WARN: `  WARN `,
  ERROR: ` ✗ ERROR `,
  DEBUG: `  DEBUG `,
};

//* We can hardcode the max length of the level name,
//* but it would be better to calculate it dynamically
//* in case of changes.
const maxLevelNameLength = Math.max(...Object.values(LevelNames).map((name) => name.length));

const formatter: log.FormatterFunction = (record) => {
  let levelName = LevelNames[record.levelName as keyof typeof LevelNames];
  levelName = levelName.padEnd(maxLevelNameLength);

  let levelColour;
  switch (record.levelName as keyof typeof LevelNames) {
    case 'INFO':
      levelColour = blue;
      break;
    case 'WARN':
      levelColour = yellow;
      break;
    case 'ERROR':
      levelColour = red;
      break;
    case 'DEBUG':
      levelColour = gray;
      break;
  }

  return `${green(`[${formatDate(new Date(), 'yyyy/MM/dd hh:mm:ss a')}]`)} ${
    levelColour(`[${levelName}] ::`)
  } ${record.msg}`;
};

export const customLogger = async (logFolder?: string) => {
  const handlers: Record<string, log.BaseHandler> = {
    consoleHandler: new log.ConsoleHandler('NOTSET', { formatter, useColors: false }),
    debugHandler: new log.ConsoleHandler('DEBUG', { formatter, useColors: false }),
  };
  const loggers = {
    default: {
      handlers: ['consoleHandler'],
    },
    debug: {
      level: 'DEBUG',
      handlers: Deno.env.get('DEBUG') ? ['debugHandler'] : undefined,
    },
  } satisfies Record<string, log.LoggerConfig>;

  if (logFolder) {
    handlers.consoleFileHandler = new log.RotatingFileHandler('NOTSET', {
      filename: `${logFolder}/bouncer.log`,
      maxBackupCount: 5,
      maxBytes: 2 * 1024 * 1024,
      formatter,
    });

    loggers.default.handlers.push('consoleFileHandler');
    loggers.debug.handlers?.push('consoleFileHandler');

    await Deno.mkdir(logFolder, { recursive: true });
  }

  log.setup({
    handlers,
    loggers,
  });

  return Deno.env.get('DEBUG') ? log.getLogger('debug') : log.getLogger();
};
