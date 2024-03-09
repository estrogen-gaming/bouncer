import {
  BaseHandler,
  ConsoleHandler,
  FormatterFunction,
  getLogger,
  LoggerConfig,
  RotatingFileHandler,
  setup,
} from '@std/log';
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

/**
 * Custom {@link FormatterFunction} function to customise logging format.
 *
 * @param record Log record.
 * @returns Customised log string.
 */
const formatter: FormatterFunction = (record) => {
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

/**
 * Sets up a custom logger with custom formatter and handlers.
 *
 * @param logFolder Folder to save logs in.
 * @returns Custom logger instance.
 */
export const customLogger = async (logFolder?: string) => {
  const handlers: Record<string, BaseHandler> = {
    consoleHandler: new ConsoleHandler('NOTSET', { formatter, useColors: false }),
    debugHandler: new ConsoleHandler('DEBUG', { formatter, useColors: false }),
  };
  const loggers = {
    default: {
      handlers: ['consoleHandler'],
    },
    debug: {
      level: 'DEBUG',
      handlers: Deno.env.get('DEBUG') ? ['debugHandler'] : undefined,
    },
  } satisfies Record<string, LoggerConfig>;

  if (logFolder) {
    handlers.consoleFileHandler = new RotatingFileHandler('NOTSET', {
      filename: `${logFolder}/bouncer.log`,
      maxBackupCount: 5,
      maxBytes: 2 * 1024 * 1024,
      formatter,
    });

    loggers.default.handlers.push('consoleFileHandler');
    loggers.debug.handlers?.push('consoleFileHandler');

    await Deno.mkdir(logFolder, { recursive: true });
  }

  setup({
    handlers,
    loggers,
  });

  return Deno.env.get('DEBUG') ? getLogger('debug') : getLogger();
};
