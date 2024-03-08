import * as YAML from '@std/yaml';

import { number, object, string, ZodError } from '@x/zod';
import { fromZodError } from '@npm/zod-validation-error';

export const ConfigSchema = object({
  database: string().default('data/db'),
  logFolder: string().optional(),
  discord: object({
    token: string(),
    server: string(),
  }),
});

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
