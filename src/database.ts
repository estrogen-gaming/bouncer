import { dirname } from '@std/path';

import { existsPath } from './utils.ts';

export enum InterviewType {
  Text,
  Id,
}

export enum InterviewStatus {
  ApprovedByText,
  ApprovedById,
  Unapproved,
}

export interface UserData {
  interviewStatus: InterviewStatus;
}

export interface UserInterview {
  interviewType: InterviewType;
  channelId: string;
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
