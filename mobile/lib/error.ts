/**
 * Extracts a human-readable message from an unknown catch value.
 * Use this in every catch block instead of `err: any`.
 *
 * Usage:
 *   } catch (err) {
 *     Alert.alert('Failed', getErrorMessage(err))
 *   }
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred.";
}
