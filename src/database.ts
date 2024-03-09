import { dirname } from '@std/path';
import { existsPath } from './utils.ts';

export enum InterviewType {
  Text,
  Id,
}

export interface Interview {
  interviewType: InterviewType;
}

/**
 * Setup a database instance.
 *
 * @param path Database file paths.
 * @returns Database instance.
 */
export const setupDatabase = async (path: string) => {
  const folder = dirname(path);

  if (path && !await existsPath(folder)) {
    await Deno.mkdir(folder, { recursive: true });
  }

  return await Deno.openKv(path);
};
