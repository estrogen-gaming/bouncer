/**
 * Check if specified path exists.
 *
 * @param path Path to check if exists.
 * @returns `true` if path exists, `false` otherwise.
 */
export const existsPath = async (path: string) => {
  try {
    await Deno.stat(path);

    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
};
