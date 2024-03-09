import { parse as parseYAML } from '@std/yaml';

import { custom, input, object, string, ZodError } from '@x/zod';
import { fromZodError } from '@npm/zod-validation-error';

const numericString = custom<string>(
  (value) => typeof value === 'string' ? /^\d+$/.test(value) : false,
  'Value should be a numeric string.',
);

export const DiscordConfigChannelsSchema = object({
  interviewFlagsId: numericString,
});

export const DiscordConfigRolesSchema = object({
  pendingInterviewId: numericString,
  nsfwAccessId: numericString,
  nsfwVerifiedId: numericString,
});

export const DiscordConfigSchema = object({
  token: string(),
  serverId: numericString,
  interviewsCategoryId: numericString,
  channels: DiscordConfigChannelsSchema,
  roles: DiscordConfigRolesSchema,
});

export const ConfigSchema = object({
  database: string().default('data/db'),
  logFolder: string().optional(),
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
