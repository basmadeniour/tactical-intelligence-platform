import React from 'react';
import type { PitchFrame } from '../../types/tactical';

interface PitchMapProps {
  frame: PitchFrame;
  showOpponent?: boolean;
  showCompactness?: boolean;
  showLines?: boolean;
  highlightPlayerId?: number;
  width?: string;
  heatmapPoints?: {
    x: number;
    y: number;
    intensity: number;
  }[];
}

const FIELD = {
  left: 25,
  top: 25,
  width: 1000,
  height: 600,
  lengthM: 105,
  widthM: 68,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Convert player coordinates (0–100%) to SVG coordinates.
 */
const pitchX = (x: number): number =>
  FIELD.left + (clamp(x, 0, 100) / 100) * FIELD.width;

const pitchY = (y: number): number =>
  FIELD.top + (clamp(y, 0, 100) / 100) * FIELD.height;

/**
 * Convert metres from the left edge into SVG coordinates.
 */
const lineX = (metres: number): number =>
  FIELD.left +
  (clamp(metres, 0, FIELD.lengthM) / FIELD.lengthM) *
    FIELD.width;

/**
 * Calculate the convex hull using the monotonic chain algorithm.
 */
const getConvexHull = (
  players: { x: number; y: number }[]
): { x: number; y: number }[] => {
  const uniquePoints = Array.from(
    new Map(
      players.map((point) => [
        `${point.x},${point.y}`,
        { x: point.x, y: point.y },
      ])
    ).values()
  );

  if (uniquePoints.length < 3) {
    return uniquePoints;
  }

  const points = [...uniquePoints].sort(
    (a, b) => a.x - b.x || a.y - b.y
  );

  const cross = (
    origin: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number =>
    (a.x - origin.x) * (b.y - origin.y) -
    (a.y - origin.y) * (b.x - origin.x);

  const lower: { x: number; y: number }[] = [];

  for (const point of points) {
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

  const upper: { x: number; y: number }[] = [];

  for (const point of [...points].reverse()) {
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

  if (hull.length < 3) {
    return [];
  }

  return hull;
};

export const PitchMap: React.FC<PitchMapProps> = ({
  frame,
  showOpponent = true,
  showCompactness = false,
  showLines = false,
  highlightPlayerId,
  width = '100%',
  heatmapPoints,
}) => {
  /*
   * Player positions are currently "Unknown" in the data adapter.
   * Therefore, the hull includes all home players because goalkeepers
   * cannot yet be reliably identified.
   */
  const hullPoints = getConvexHull(frame.homePlayers);

  const polygonStr = hullPoints
    .map((point) => `${pitchX(point.x)},${pitchY(point.y)}`)
    .join(' ');

  const defensiveX = lineX(frame.defensiveLineM);
  const attackingX = lineX(frame.attackingLineM);

  return (
    <div
      style={{
        width,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <svg
        viewBox="0 0 1050 650"
        role="img"
        aria-label="Football pitch showing player positions and tactical metrics"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          background: '#1A5C3A',
        }}
      >
        <defs>
          <pattern
            id="grassStripes"
            patternUnits="userSpaceOnUse"
            width="131"
            height="650"
          >
            <rect
              width="65.5"
              height="650"
              fill="#1A5C3A"
            />

            <rect
              x="65.5"
              width="65.5"
              height="650"
              fill="#17523A"
            />
          </pattern>

          <filter
            id="heatmapBlur"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="8" />
          </filter>

          <clipPath id="pitchClip">
            <rect
              x={FIELD.left}
              y={FIELD.top}
              width={FIELD.width}
              height={FIELD.height}
            />
          </clipPath>
        </defs>

        {/* Background */}
        <rect
          width="1050"
          height="650"
          fill="url(#grassStripes)"
        />

        {/* Pitch markings */}
        <g
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2.5"
        >
          {/* Outer boundary */}
          <rect
            x={FIELD.left}
            y={FIELD.top}
            width={FIELD.width}
            height={FIELD.height}
          />

          {/* Halfway line */}
          <line
            x1={FIELD.left + FIELD.width / 2}
            y1={FIELD.top}
            x2={FIELD.left + FIELD.width / 2}
            y2={FIELD.top + FIELD.height}
          />

          {/* Centre circle */}
          <circle
            cx={FIELD.left + FIELD.width / 2}
            cy={FIELD.top + FIELD.height / 2}
            r="91.5"
          />

          {/* Left penalty area */}
          <rect
            x={FIELD.left}
            y="138.5"
            width="165"
            height="373"
          />

          <rect
            x={FIELD.left}
            y="230"
            width="55"
            height="190"
          />

          <path d="M 190 262 A 91.5 91.5 0 0 1 190 388" />

          {/* Right penalty area */}
          <rect
            x="860"
            y="138.5"
            width="165"
            height="373"
          />

          <rect
            x="970"
            y="230"
            width="55"
            height="190"
          />

          <path d="M 860 262 A 91.5 91.5 0 0 0 860 388" />

          {/* Goals */}
          <rect
            x="5"
            y="270"
            width="20"
            height="110"
          />

          <rect
            x="1025"
            y="270"
            width="20"
            height="110"
          />

          {/* Corner arcs */}
          <path d="M 25 35 A 10 10 0 0 0 35 25" />
          <path d="M 25 615 A 10 10 0 0 1 35 625" />
          <path d="M 1025 35 A 10 10 0 0 1 1015 25" />
          <path d="M 1025 615 A 10 10 0 0 0 1015 625" />
        </g>

        {/* Pitch spots */}
        <g fill="rgba(255,255,255,0.7)">
          <circle
            cx="525"
            cy="325"
            r="3.5"
          />

          <circle
            cx="135"
            cy="325"
            r="3"
          />

          <circle
            cx="915"
            cy="325"
            r="3"
          />
        </g>

        {/* Dynamic overlays */}
        <g clipPath="url(#pitchClip)">
          {/* Heatmap */}
          {heatmapPoints?.map((point, index) => {
            const intensity = clamp(point.intensity, 0, 1);

            return (
              <circle
                key={`heat-${index}`}
                cx={pitchX(point.x)}
                cy={pitchY(point.y)}
                r={60 + intensity * 40}
                fill={`rgba(184, 240, 90, ${intensity * 0.3})`}
                filter="url(#heatmapBlur)"
              />
            );
          })}

          {/* Home-team compactness */}
          {showCompactness && hullPoints.length >= 3 && (
            <g>
              <polygon
                points={polygonStr}
                fill="rgba(184, 240, 90, 0.1)"
                stroke="rgba(184, 240, 90, 0.8)"
                strokeWidth="2"
                strokeDasharray="6,4"
              />

              <circle
                cx={pitchX(frame.centroid.x)}
                cy={pitchY(frame.centroid.y)}
                r="7"
                fill="#B8F05A"
                opacity={0.9}
              />

              <text
                x={pitchX(frame.centroid.x) + 12}
                y={pitchY(frame.centroid.y) - 10}
                fill="#B8F05A"
                fontSize="12"
                fontWeight="bold"
                fontFamily="Inter, sans-serif"
              >
                {Number.isFinite(frame.compactnessAreaM2)
                  ? `${frame.compactnessAreaM2.toFixed(1)} m²`
                  : 'N/A'}
              </text>
            </g>
          )}

          {/* Defensive and attacking lines */}
          {showLines && (
            <g>
              {/* Defensive line */}
              <line
                x1={defensiveX}
                y1={FIELD.top}
                x2={defensiveX}
                y2={FIELD.top + FIELD.height}
                stroke="#F2B84B"
                strokeWidth="2"
                strokeDasharray="8,4"
              />

              <text
                x={clamp(
                  defensiveX + 6,
                  FIELD.left + 4,
                  FIELD.left + FIELD.width - 95
                )}
                y="48"
                fill="#F2B84B"
                fontSize="12"
                fontWeight="bold"
                fontFamily="Barlow, sans-serif"
              >
                Def {frame.defensiveLineM.toFixed(1)}m
              </text>

              {/* Attacking line */}
              <line
                x1={attackingX}
                y1={FIELD.top}
                x2={attackingX}
                y2={FIELD.top + FIELD.height}
                stroke="#B8F05A"
                strokeWidth="2"
                strokeDasharray="8,4"
              />

              <text
                x={clamp(
                  attackingX - 85,
                  FIELD.left + 4,
                  FIELD.left + FIELD.width - 90
                )}
                y="65"
                fill="#B8F05A"
                fontSize="12"
                fontWeight="bold"
                fontFamily="Barlow, sans-serif"
              >
                Att {frame.attackingLineM.toFixed(1)}m
              </text>
            </g>
          )}

          {/* Opponent players */}
          {showOpponent &&
            frame.awayPlayers.map((player) => {
              const x = pitchX(player.x);
              const y = pitchY(player.y);

              return (
                <g key={`away-${player.id}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="#F4F6F3"
                    stroke="#8A98A5"
                    strokeWidth="2"
                  />

                  <text
                    x={x}
                    y={y + 4.5}
                    textAnchor="middle"
                    fill="#101820"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="Barlow, sans-serif"
                  >
                    {player.number}
                  </text>
                </g>
              );
            })}

          {/* Home players */}
          {frame.homePlayers.map((player) => {
            const isHighlighted = highlightPlayerId === player.id;

            const x = pitchX(player.x);
            const y = pitchY(player.y);

            return (
              <g key={`home-${player.id}`}>
                {isHighlighted && (
                  <circle
                    cx={x}
                    cy={y}
                    r="22"
                    fill="none"
                    stroke="#B8F05A"
                    strokeWidth="3"
                    opacity={0.8}
                  >
                    <animate
                      attributeName="r"
                      values="19;24;19"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />

                    <animate
                      attributeName="opacity"
                      values="0.8;0.3;0.8"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill={isHighlighted ? '#B8F05A' : '#1F6B45'}
                  stroke="white"
                  strokeWidth="2"
                />

                <text
                  x={x}
                  y={y + 4.5}
                  textAnchor="middle"
                  fill={isHighlighted ? '#101820' : 'white'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="Barlow, sans-serif"
                >
                  {player.number}
                </text>
              </g>
            );
          })}

          {/* Ball */}
          <circle
            cx={pitchX(frame.ball.x)}
            cy={pitchY(frame.ball.y)}
            r="8"
            fill="#B8F05A"
            stroke="#101820"
            strokeWidth="2.5"
          />
        </g>
      </svg>
    </div>
  );
};