import trackingData from "../data/tracking_sample.json";

import type {
  PitchFrame,
  PlayerCoordinate,
  PhaseKey,
} from "../types/tactical";

type RawPlayer = {
  jerseyNum: string;
  confidence?: string;
  visibility?: string;
  x: number;
  y: number;
};

type RawFrame = {
  frameNum: number;
  videoTimeMs: number;
  period: number;
  periodElapsedTime: number;
  periodGameClockTime: number;
  homePlayers: RawPlayer[];
  awayPlayers: RawPlayer[];
  ball: {
    x: number;
    y: number;
    z?: number;
    visibility?: string;
  } | null;
};

const frames = trackingData as RawFrame[];

const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;
const HALF_LENGTH = PITCH_LENGTH / 2;
const HALF_WIDTH = PITCH_WIDTH / 2;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// تحويل الإحداثيات المترية إلى النطاق 0–100 المستخدم في PitchMap.
const toPitchX = (x: number) =>
  clamp(((x + HALF_LENGTH) / PITCH_LENGTH) * 100, 0, 100);

const toPitchY = (y: number) =>
  clamp(((y + HALF_WIDTH) / PITCH_WIDTH) * 100, 0, 100);

const toZone = (x: number, y: number): string => {
  const horizontal =
    x < 33.33
      ? "Defensive Third"
      : x < 66.67
        ? "Middle Third"
        : "Attacking Third";

  const vertical =
    y < 33.33
      ? "Left"
      : y < 66.67
        ? "Center"
        : "Right";

  return `${horizontal} - ${vertical}`;
};

function convertPlayers(
  players: RawPlayer[],
  team: "home" | "away",
  frameIndex: number
): PlayerCoordinate[] {
  return players.map((player, index) => {
    const previousFrame = frames[Math.max(0, frameIndex - 1)];

    const previousPlayers =
      team === "home"
        ? previousFrame.homePlayers
        : previousFrame.awayPlayers;

    const previousPlayer = previousPlayers.find(
      (p) => p.jerseyNum === player.jerseyNum
    );

    const currentFrame = frames[frameIndex];

    const previousTime =
      frameIndex > 0
        ? frames[frameIndex - 1].periodElapsedTime
        : currentFrame.periodElapsedTime;

    const deltaTime =
      currentFrame.periodElapsedTime - previousTime;

    let speedKmH = 0;

    if (previousPlayer && deltaTime > 0) {
      const distance = Math.hypot(
        player.x - previousPlayer.x,
        player.y - previousPlayer.y
      );

      speedKmH = (distance / deltaTime) * 3.6;
    }

    const x = toPitchX(player.x);
    const y = toPitchY(player.y);

    return {
      id: team === "home" ? index + 1 : index + 21,
      name: `${team === "home" ? "Home" : "Away"} #${player.jerseyNum}`,
      number: Number(player.jerseyNum),
      position: "Unknown",
      team,
      x,
      y,
      speedKmH,
      currentZone: toZone(x, y),
    };
  });
}

function convexHullArea(
  points: { x: number; y: number }[]
): number {
  if (points.length < 3) return 0;

  const sorted = [...points].sort(
    (a, b) => a.x - b.x || a.y - b.y
  );

  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) =>
    (a.x - o.x) * (b.y - o.y) -
    (a.y - o.y) * (b.x - o.x);

  const lower: typeof sorted = [];

  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(
        lower[lower.length - 2],
        lower[lower.length - 1],
        point
      ) <= 0
    ) {
      lower.pop();
    }

    lower.push(point);
  }

  const upper: typeof sorted = [];

  for (const point of [...sorted].reverse()) {
    while (
      upper.length >= 2 &&
      cross(
        upper[upper.length - 2],
        upper[upper.length - 1],
        point
      ) <= 0
    ) {
      upper.pop();
    }

    upper.push(point);
  }

  lower.pop();
  upper.pop();

  const hull = [...lower, ...upper];

  let area = 0;

  for (let i = 0; i < hull.length; i++) {
    const current = hull[i];
    const next = hull[(i + 1) % hull.length];

    area +=
      current.x * next.y -
      next.x * current.y;
  }

  return Math.abs(area) / 2;
}

function getTeamMetrics(players: RawPlayer[]) {
  if (!players.length) {
    return {
      width: 0,
      depth: 0,
      area: 0,
      centroidX: 0,
      centroidY: 0,
      minX: 0,
      maxX: 0,
    };
  }

  const xs = players.map((p) => p.x);
  const ys = players.map((p) => p.y);

  return {
    width: Math.max(...ys) - Math.min(...ys),
    depth: Math.max(...xs) - Math.min(...xs),
    area: convexHullArea(
      players.map((p) => ({ x: p.x, y: p.y }))
    ),
    centroidX:
      xs.reduce((sum, x) => sum + x, 0) / xs.length,
    centroidY:
      ys.reduce((sum, y) => sum + y, 0) / ys.length,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
  };
}

/**
 * تحويل Frame خام إلى PitchFrame تستخدمه مكونات الواجهة.
 */
function convertFrame(
  rawFrame: RawFrame,
  frameIndex: number
): PitchFrame {
  const homePlayers = convertPlayers(
    rawFrame.homePlayers,
    "home",
    frameIndex
  );

  const awayPlayers = convertPlayers(
    rawFrame.awayPlayers,
    "away",
    frameIndex
  );

  const metrics = getTeamMetrics(rawFrame.homePlayers);

  const ball = rawFrame.ball
    ? {
        x: toPitchX(rawFrame.ball.x),
        y: toPitchY(rawFrame.ball.y),
      }
    : { x: 50, y: 50 };

  const phaseKey: PhaseKey = "build_up";

  return {
    timestamp: `${Math.floor(
      rawFrame.periodElapsedTime / 60
    )
      .toString()
      .padStart(2, "0")}:${Math.floor(
      rawFrame.periodElapsedTime % 60
    )
      .toString()
      .padStart(2, "0")}`,

    timeSec: rawFrame.periodElapsedTime,
    phaseLabel: "Tracking Data",
    phaseKey,
    ball,
    homePlayers,
    awayPlayers,
    compactnessAreaM2: metrics.area,
    teamWidthM: metrics.width,
    teamDepthM: metrics.depth,
    defensiveLineM: metrics.minX + HALF_LENGTH,
    attackingLineM: metrics.maxX + HALF_LENGTH,
    centroid: {
      x: toPitchX(metrics.centroidX),
      y: toPitchY(metrics.centroidY),
    },
  };
}

/**
 * إرجاع عدد الـ Frames المتاحة.
 */
export function getFrameCount(): number {
  return frames.length;
}

/**
 * إرجاع Frame حسب ترتيبه في ملف التتبع.
 */
export function getFrameAtIndex(
  index: number
): PitchFrame | null {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= frames.length
  ) {
    return null;
  }

  const rawFrame = frames[index];

  if (!rawFrame) {
    return null;
  }

  return convertFrame(rawFrame, index);
}

/**
 * إرجاع أقرب Frame إلى الزمن المطلوب بالثواني.
 */
export function getFrameAtTime(
  timeSec: number
): PitchFrame {
  if (frames.length === 0) {
    throw new Error(
      "Tracking data is empty. Check tracking_sample.json."
    );
  }

  const requestedTime = Math.max(0, timeSec);

  let frameIndex = 0;

  for (let i = 1; i < frames.length; i++) {
    if (
      Math.abs(
        frames[i].periodElapsedTime - requestedTime
      ) <
      Math.abs(
        frames[frameIndex].periodElapsedTime - requestedTime
      )
    ) {
      frameIndex = i;
    }
  }

  return convertFrame(frames[frameIndex], frameIndex);
}

