import * as YAML from '@std/yaml';

import { input, object, string, ZodError } from '@x/zod';
import { fromZodError } from '@npm/zod-validation-error';

export const DiscordConfigRolesSchema = object({
  nsfwAccessId: string(),
  nsfwVerifiedId: string(),
});

export const DiscordConfigSchema = object({
  token: string(),
  server: string(),
  interviewsCategoryId: string(),
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

export const parseConfig = async (path: string) => {
  try {
    const file = await Deno.readTextFile(path);
    const config = YAML.parse(file);

    return ConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }

    throw error;
  }
};
