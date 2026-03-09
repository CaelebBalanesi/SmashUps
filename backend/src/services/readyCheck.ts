import { OpponentInfo } from './matchmaking';

export const READY_TIMEOUT_MS = 30_000;

export type ReadyResult = 'waiting' | 'confirmed' | 'already_ready' | 'not_found';

export interface ReadyCallbacks {
  /** Called when both players confirm — fire-and-forget async OK */
  onConfirmed: () => void;
  /** Called when this player did NOT ready in time */
  onDeclined: () => void;
  /** Called when this player DID ready but the opponent did not */
  onRequeue: () => void;
}

interface ReadyCheckPlayer {
  userId: string;
  ready: boolean;
  opponentInfo: OpponentInfo;
  searchParams: { main: string; lookingFor: string[] };
  callbacks: ReadyCallbacks;
  reenterPool: () => void;
}

interface ReadyCheckEntry {
  matchId: string;
  players: ReadyCheckPlayer[];
  timer: ReturnType<typeof setTimeout>;
}

const checks = new Map<string, ReadyCheckEntry>();
/** Reverse lookup so we can find a matchId by userId without scanning. */
const userToMatchId = new Map<string, string>();

export function registerForReadyCheck(
  matchId: string,
  userId: string,
  opponentInfo: OpponentInfo,
  searchParams: { main: string; lookingFor: string[] },
  callbacks: ReadyCallbacks,
  reenterPool: () => void,
): void {
  const player: ReadyCheckPlayer = {
    userId,
    ready: false,
    opponentInfo,
    searchParams,
    callbacks,
    reenterPool,
  };

  userToMatchId.set(userId, matchId);

  const existing = checks.get(matchId);
  if (!existing) {
    const timer = setTimeout(() => handleTimeout(matchId), READY_TIMEOUT_MS);
    checks.set(matchId, { matchId, players: [player], timer });
  } else {
    existing.players.push(player);
  }
}

export function markReady(matchId: string, userId: string): ReadyResult {
  const check = checks.get(matchId);
  if (!check) return 'not_found';

  const player = check.players.find((p) => p.userId === userId);
  if (!player) return 'not_found';
  if (player.ready) return 'already_ready';

  player.ready = true;

  const allReady = check.players.length === 2 && check.players.every((p) => p.ready);
  if (allReady) {
    clearTimeout(check.timer);
    checks.delete(matchId);
    check.players.forEach((p) => {
      userToMatchId.delete(p.userId);
      p.callbacks.onConfirmed();
    });
    return 'confirmed';
  }

  return 'waiting';
}

/**
 * Cancel the ready check for a specific player (e.g. they disconnected or stopped searching).
 * The other player is re-queued if they had already readied, otherwise declined.
 */
export function cancelReadyCheckForUser(userId: string): void {
  const matchId = userToMatchId.get(userId);
  if (!matchId) return;

  const check = checks.get(matchId);
  if (!check) return;

  clearTimeout(check.timer);
  checks.delete(matchId);
  check.players.forEach((p) => userToMatchId.delete(p.userId));

  for (const player of check.players) {
    if (player.userId === userId) continue;
    if (player.ready) {
      player.callbacks.onRequeue();
      player.reenterPool();
    } else {
      player.callbacks.onDeclined();
    }
  }
}

/** Returns the opponent info for a player in a pending ready check. */
export function getOpponentInfo(matchId: string, userId: string): OpponentInfo | undefined {
  return checks.get(matchId)?.players.find((p) => p.userId === userId)?.opponentInfo;
}

function handleTimeout(matchId: string) {
  const check = checks.get(matchId);
  if (!check) return;

  checks.delete(matchId);
  check.players.forEach((p) => userToMatchId.delete(p.userId));

  for (const player of check.players) {
    if (player.ready) {
      player.callbacks.onRequeue();
      player.reenterPool();
    } else {
      player.callbacks.onDeclined();
    }
  }
}
