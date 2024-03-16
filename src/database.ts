import { dirname } from '@std/path';

import { existsPath } from './utils.ts';

/**
 * Type of the interview.
 */
export enum InterviewType {
  /**
   * Text interview.
   */
  Text,
  /**
   * Id interview.
   */
  Id,
}

/**
 * Status of the interview.
 */
export enum InterviewStatus {
  /**
   * User has been approved.
   */
  Approved,
  /**
   * User is on an ongoing interview.
   */
  Ongoing,
  /**
   * User has been disapproved.
   */
  Disapproved,
  /**
   * User is pending approval.
   */
  Pending,
}

/**
 * Interview data.
 */
interface Interview {
  /**
   * Type of the interview.
   */
  type?: InterviewType;
  /**
   * Status of the interview.
   */
  status: InterviewStatus;
  /**
   * Channel ID of the interview.
   */
  channelId?: string;
  /**
   * Interviewer.
   */
  by?: string;
}

/**
 * User data.
 */
export interface UserData {
  /**
   * Interview data.
   */
  interview: Interview;
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
