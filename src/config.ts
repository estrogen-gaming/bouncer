import { bigint, defaulted, type Describe, object, string } from '@npm/superstruct';

export interface Config {
  // Database file location
  database: string;
  // Server ID to operate in
  server: bigint;
}

export const ConfigSchema = object({
  database: defaulted(string(), 'data/db'),
  server: bigint(),
}) satisfies Describe<Config>;

export const verifyConfig = (config: unknown) => {
  const result = ConfigSchema.validate(config);

  if (result?.[0]) {
    throw result[0];
  }

  return result[1];
};
