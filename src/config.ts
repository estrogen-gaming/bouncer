import { number, object, string, ZodError } from '@x/zod';
import { fromZodError } from '@npm/zod-validation-error';

export const ConfigSchema = object({
  database: string().default('data/db'),
  server: number(),
});

export const validateConfig = (config: unknown) => {
  try {
    return ConfigSchema.parse(config);
  } catch (error) {
    throw fromZodError(error);
  }
};
