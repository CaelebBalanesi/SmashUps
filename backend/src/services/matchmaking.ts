export interface OpponentInfo {
  id: string;
  username: string;
  avatar?: string;
  main: string;
}

interface PoolEntry {
  userId: string;
  username: string;
  avatar?: string;
  main: string;
  lookingFor: string[]; // empty = any character
  onMatch: (opponent: OpponentInfo) => void;
}

const pool: PoolEntry[] = [];

function isMatch(a: PoolEntry, b: PoolEntry): boolean {
  const aWantsB = a.lookingFor.length === 0 || a.lookingFor.includes(b.main);
  const bWantsA = b.lookingFor.length === 0 || b.lookingFor.includes(a.main);
  return aWantsB && bWantsA;
}

/**
 * Add a user to the search pool. If a mutual match is found immediately,
 * both onMatch callbacks are fired and neither is added to the pool.
 * Returns true if matched immediately, false if added to pool.
 */
export function enterPool(
  userId: string,
  username: string,
  avatar: string | undefined,
  main: string,
  lookingFor: string[],
  onMatch: (opponent: OpponentInfo) => void,
): boolean {
  leavePool(userId);

  const entry: PoolEntry = { userId, username, avatar, main, lookingFor, onMatch };
  const match = pool.find((other) => isMatch(entry, other));

  if (match) {
    pool.splice(pool.indexOf(match), 1);
    entry.onMatch({ id: match.userId, username: match.username, avatar: match.avatar, main: match.main });
    match.onMatch({ id: entry.userId, username: entry.username, avatar: entry.avatar, main: entry.main });
    return true;
  }

  pool.push(entry);
  return false;
}

/** Remove a user from the pool. Returns true if they were in the pool. */
export function leavePool(userId: string): boolean {
  const index = pool.findIndex((e) => e.userId === userId);
  if (index !== -1) {
    pool.splice(index, 1);
    return true;
  }
  return false;
}

export function isInPool(userId: string): boolean {
  return pool.some((e) => e.userId === userId);
}
