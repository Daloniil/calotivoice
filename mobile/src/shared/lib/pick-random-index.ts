/** Random index in [0, length), avoiding `avoid` when possible. */
export function pickRandomIndex(length: number, avoid: number): number {
  if (length <= 0) {
    return 0;
  }
  if (length === 1) {
    return 0;
  }
  let next = Math.floor(Math.random() * length);
  if (next === avoid) {
    next = (next + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return next;
}
