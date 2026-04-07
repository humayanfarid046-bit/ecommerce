/** Demo points, daily check-in, spin wheel (localStorage). */

const KEY = "libas_gamification_v1";

export type GamificationState = {
  points: number;
  /** YYYY-MM-DD last check-in */
  lastCheckIn: string | null;
  spinWheelUsed: boolean;
};

function read(): GamificationState {
  if (typeof window === "undefined") {
    return { points: 0, lastCheckIn: null, spinWheelUsed: false };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { points: 0, lastCheckIn: null, spinWheelUsed: false };
    const p = JSON.parse(raw) as GamificationState;
    return {
      points: typeof p.points === "number" ? p.points : 0,
      lastCheckIn: p.lastCheckIn ?? null,
      spinWheelUsed: Boolean(p.spinWheelUsed),
    };
  } catch {
    return { points: 0, lastCheckIn: null, spinWheelUsed: false };
  }
}

function write(s: GamificationState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function loadGamification(): GamificationState {
  return read();
}

export function saveGamification(s: GamificationState): void {
  write(s);
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
