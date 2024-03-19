import { parse as parseYAML } from '@std/yaml';

import { custom, input, object, string, ZodError } from '@x/zod';
import { fromZodError } from '@npm/zod-validation-error';

const numericString = () =>
  custom<string>(
    (value) => typeof value === 'string' ? /^\d+$/.test(value) : false,
    'Value should be a numeric string.',
  );

export const DiscordConfigChannelsSchema = object({
  /**
   * The category ID where the interview channels will be created.
   */
  interviewsCategoryId: numericString(),
  /**
   * The channel ID where the bot will send interview flags.
   */
  interviewFlagsId: numericString(),
});

export const DiscordConfigRolesSchema = object({
  /**
   * The role ID for the server moderators.
   */
  moderatorId: numericString(),
  /**
   * The role ID for pending interviews.
   */
  pendingInterviewId: numericString(),
  /**
   * The role ID for ongoing interviews.
   */
  ongoingInterviewId: numericString(),
  /**
   * The role ID for disapproved interviews.
   */
  disapprovedInterviewId: numericString(),
  /**
   * The role ID for users approved with text interview.
   */
  nsfwAccessId: numericString(),
  /**
   * The role ID for users approved with ID interview.
   */
  nsfwVerifiedId: numericString(),
});

export const DiscordConfigSchema = object({
  /**
   * The bot's token.
   */
  token: string(),
  /**
   * The server id where the bot will operate.
   */
  serverId: numericString(),
  /**
   * Channels configuration.
   */
  channels: DiscordConfigChannelsSchema,
  /**
   * Roles configuration.
   */
  roles: DiscordConfigRolesSchema,
});

export const ConfigSchema = object({
  /**
   * The database path.
   */
  database: string().default('data/db'),
  /**
   * The log folder path.
   */
  logFolder: string().optional(),
  /**
   * Discord configuration.
   */
  discord: DiscordConfigSchema,
});

export type DiscordConfigRoles = input<typeof DiscordConfigRolesSchema>;
export type DiscordConfig = input<typeof DiscordConfigSchema>;
export type Config = input<typeof ConfigSchema>;

/**
 * Parses config file and returns the parsed data.
 *
 * @param path Config path to parse.
 * @returns Parsed config data. Throws {@link fromZodError} error if parsing fails.
 */
export const parseConfig = async (path: string) => {
  try {
    const file = await Deno.readTextFile(path);
    const config = parseYAML(file);

    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }
};
