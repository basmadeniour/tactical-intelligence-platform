import React, { useState, useMemo } from 'react';
import {
  HOME_ROSTER,
  PLAYER_STATS,
  INSIGHTS,
} from '../data/demoData';

import {
  Insight,
  PlayerInfo,
  PlayerMovementStats,
} from '../types/tactical';

import { PitchMap } from '../components/shared/PitchMap';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { DataQualityBadge } from '../components/shared/DataQualityBadge';
import { getFrameAtTime } from '../services/simulationEngine';

import {
  User,
  MapPin,
  Footprints,
  Gauge,
  Clock,
  ArrowRight,
  Info,
  Activity,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Layers,
} from 'lucide-react';

interface PlayerDrilldownPageProps {
  onOpenEvidence: (insight: Insight) => void;
}

const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginBottom: 'var(--space-4)',
};

const sectionIconStyle: React.CSSProperties = {
  color: 'var(--tactical-lime)',
  flexShrink: 0,
};

const mutedTextStyle: React.CSSProperties = {
  color: 'var(--slate-gray)',
  fontSize: '14px',
  lineHeight: 1.6,
};

const formatNumber = (value: number, digits = 1) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const getPrimaryZone = (stats: PlayerMovementStats) => {
  if (stats.zoneOccupancy.length === 0) {
    return 'Not available';
  }

  return [...stats.zoneOccupancy].sort(
    (a, b) => b.percentage - a.percentage
  )[0].zone;
};

export const PlayerDrilldownPage: React.FC<
  PlayerDrilldownPageProps
> = ({ onOpenEvidence }) => {
  const [selectedPlayerId, setSelectedPlayerId] =
    useState<number>(7);

  const player = HOME_ROSTER.find(
    (p) => p.id === selectedPlayerId
  );

  const stats = PLAYER_STATS.find(
    (s) => s.playerId === selectedPlayerId
  );

  // The current demo uses a fixed match frame.
  const midFrame = useMemo(
    () => getFrameAtTime(2700),
    []
  );

  const selectablePlayers = HOME_ROSTER.filter(
    (p) => p.position !== 'Goalkeeper'
  );

  // Compare only players for whom movement statistics exist.
  const comparisonStats = useMemo(() => {
    if (PLAYER_STATS.length === 0) {
      return {
        distance: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        minutes: 0,
        count: 0,
      };
    }

    const count = PLAYER_STATS.length;

    return {
      distance:
        PLAYER_STATS.reduce(
          (sum, item) => sum + item.estimatedDistanceKm,
          0
        ) / count,

      avgSpeed:
        PLAYER_STATS.reduce(
          (sum, item) => sum + item.estimatedAvgSpeedKmH,
          0
        ) / count,

      maxSpeed:
        PLAYER_STATS.reduce(
          (sum, item) => sum + item.estimatedMaxSpeedKmH,
          0
        ) / count,

      minutes:
        PLAYER_STATS.reduce(
          (sum, item) => sum + item.minutesPlayed,
          0
        ) / count,

      count,
    };
  }, []);

  const relatedInsights = useMemo(() => {
    if (!stats) return [];

    return stats.relatedInsightIds
      .map((id) => INSIGHTS.find((insight) => insight.id === id))
      .filter((insight): insight is Insight => Boolean(insight));
  }, [stats]);

  const primaryZone = stats
    ? getPrimaryZone(stats)
    : 'Not available';

  const primaryZonePercentage = stats
    ? Math.max(
        0,
        ...stats.zoneOccupancy.map((zone) => zone.percentage)
      )
    : 0;

  const maxZonePercentage = stats
    ? Math.max(
        1,
        ...stats.zoneOccupancy.map((zone) => zone.percentage)
      )
    : 100;

  const movementCards = stats
    ? [
        {
          label: 'Estimated Distance',
          value: formatNumber(stats.estimatedDistanceKm),
          unit: 'km',
          icon: <Footprints size={22} />,
          color: 'var(--tactical-lime)',
          comparison: comparisonStats.distance,
          comparisonLabel: 'Recorded-player average',
          higherIsBetter: null,
        },
        {
          label: 'Average Speed',
          value: formatNumber(stats.estimatedAvgSpeedKmH),
          unit: 'km/h',
          icon: <Gauge size={22} />,
          color: 'var(--tactical-lime)',
          comparison: comparisonStats.avgSpeed,
          comparisonLabel: 'Recorded-player average',
          higherIsBetter: null,
        },
        {
          label: 'Maximum Speed',
          value: formatNumber(stats.estimatedMaxSpeedKmH),
          unit: 'km/h',
          icon: <Activity size={22} />,
          color: 'var(--alert-amber)',
          comparison: comparisonStats.maxSpeed,
          comparisonLabel: 'Recorded-player average',
          higherIsBetter: null,
        },
        {
          label: 'Minutes Played',
          value: String(stats.minutesPlayed),
          unit: 'min',
          icon: <Clock size={22} />,
          color: 'var(--slate-gray)',
          comparison: comparisonStats.minutes,
          comparisonLabel: 'Recorded-player average',
          higherIsBetter: null,
        },
      ]
    : [];

  const renderComparison = (
    playerValue: number,
    averageValue: number,
    unit: string
  ) => {
    const difference = playerValue - averageValue;

    const percentageDifference =
      averageValue !== 0
        ? (difference / averageValue) * 100
        : 0;

    const isAbove = difference > 0;
    const isEqual = Math.abs(difference) < 0.05;

    return (
      <div
        style={{
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span style={mutedTextStyle}>
            Recorded-player average
          </span>

          <span
            style={{
              color: 'var(--off-white)',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {formatNumber(averageValue)} {unit}
          </span>
        </div>

        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: isEqual
              ? 'var(--slate-gray)'
              : isAbove
                ? 'var(--tactical-lime)'
                : 'var(--alert-amber)',
          }}
        >
          {isEqual
            ? 'Approximately equal to average'
            : `${isAbove ? '+' : ''}${formatNumber(
                difference
              )} ${unit} (${isAbove ? '+' : ''}${formatNumber(
                percentageDifference
              )}%)`}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1
          className="text-page-title"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          Player Analysis
        </h1>

        <p className="text-body">
          Individual movement, playing zones, positional context,
          and tactical events involving the selected player.
        </p>
      </div>

      {/* Player Selector */}
      <div
        className="card card-compact"
        style={{ marginBottom: 'var(--space-8)' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Users
            size={20}
            style={sectionIconStyle}
          />

          <span className="text-label">
            Select Player
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          {selectablePlayers.map((p) => {
            const isActive = p.id === selectedPlayerId;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlayerId(p.id)}
                aria-pressed={isActive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    isActive
                      ? 'var(--tactical-lime)'
                      : 'var(--border-default)'
                  }`,
                  background: isActive
                    ? 'var(--green-50)'
                    : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? 'var(--tactical-lime)'
                    : 'var(--slate-gray)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    background: isActive
                      ? 'var(--tactical-lime)'
                      : 'var(--bg-surface)',
                    color: isActive
                      ? 'var(--deep-navy)'
                      : 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {p.number}
                </span>

                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {!player || !stats ? (
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h3 className="text-card-title">
            Player statistics unavailable
          </h3>

          <p
            style={{
              ...mutedTextStyle,
              marginTop: 'var(--space-3)',
            }}
          >
            No movement statistics are currently recorded for
            this player in the demo dataset.
          </p>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          {/* Player Profile */}
          <div
            className="card"
            style={{
              marginBottom: 'var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-5)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 'var(--radius-full)',
                background: 'var(--tactical-lime)',
                color: 'var(--deep-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: '30px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {player.number}
            </div>

            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--size-h2)',
                    fontWeight: 700,
                    color: 'var(--off-white)',
                  }}
                >
                  {player.name}
                </h2>

                <span
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '3px 9px',
                    color: 'var(--slate-gray)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  #{player.number}
                </span>
              </div>

              <p
                style={{
                  color: 'var(--slate-gray)',
                  fontSize: '15px',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {player.position}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--off-white)',
                    fontSize: '13px',
                  }}
                >
                  <Clock
                    size={15}
                    style={sectionIconStyle}
                  />
                  {stats.minutesPlayed} minutes played
                </span>

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--off-white)',
                    fontSize: '13px',
                  }}
                >
                  <MapPin
                    size={15}
                    style={sectionIconStyle}
                  />
                  {primaryZone}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                minWidth: 150,
              }}
            >
              <p
                style={{
                  ...mutedTextStyle,
                  marginBottom: 'var(--space-2)',
                }}
              >
                Main Playing Zone
              </p>

              <div
                style={{
                  color: 'var(--tactical-lime)',
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {primaryZonePercentage}%
              </div>

              <p
                style={{
                  color: 'var(--slate-gray)',
                  fontSize: '12px',
                  marginTop: 4,
                }}
              >
                Recorded zone occupancy
              </p>
            </div>
          </div>

          {/* Movement Metrics */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <div style={sectionTitleStyle}>
              <Activity
                size={21}
                style={sectionIconStyle}
              />

              <h3 className="text-card-title">
                Movement Metrics
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {movementCards.map((item) => (
                <div
                  key={item.label}
                  className="card card-compact"
                  style={{ minWidth: 0 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <span
                      style={{
                        ...mutedTextStyle,
                        fontWeight: 600,
                      }}
                    >
                      {item.label}
                    </span>

                    <span style={{ color: item.color }}>
                      {item.icon}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="text-metric">
                      {item.value}
                    </span>

                    <span
                      style={{
                        color: 'var(--slate-gray)',
                        fontSize: '14px',
                      }}
                    >
                      {item.unit}
                    </span>
                  </div>

                  {renderComparison(
                    item.label === 'Estimated Distance'
                      ? stats.estimatedDistanceKm
                      : item.label === 'Average Speed'
                        ? stats.estimatedAvgSpeedKmH
                        : item.label === 'Maximum Speed'
                          ? stats.estimatedMaxSpeedKmH
                          : stats.minutesPlayed,
                    item.comparison,
                    item.unit
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Movement Estimates Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 'var(--space-8)',
              color: 'var(--text-tertiary)',
              fontSize: '13px',
              lineHeight: 1.7,
            }}
          >
            <Info
              size={17}
              style={{
                flexShrink: 0,
                marginTop: 2,
              }}
            />

            <div>
              <strong
                style={{
                  color: 'var(--off-white)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                How to interpret these metrics
              </strong>

              Distance and speed are movement estimates from
              the current demo dataset, not physiological
              measurements. Comparisons use only players with
              recorded statistics; they do not represent the
              complete squad average.
            </div>
          </div>

          {/* Player vs Available Dataset */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <div style={sectionTitleStyle}>
              <BarChart3
                size={21}
                style={sectionIconStyle}
              />

              <h3 className="text-card-title">
                Player vs Recorded Players
              </h3>
            </div>

            <div className="card">
              <p
                style={{
                  ...mutedTextStyle,
                  marginBottom: 'var(--space-5)',
                }}
              >
                A side-by-side comparison against the average
                of {comparisonStats.count} players with available
                movement statistics.
              </p>

              {[
                {
                  label: 'Distance covered',
                  playerValue: stats.estimatedDistanceKm,
                  averageValue: comparisonStats.distance,
                  unit: 'km',
                },
                {
                  label: 'Average speed',
                  playerValue: stats.estimatedAvgSpeedKmH,
                  averageValue: comparisonStats.avgSpeed,
                  unit: 'km/h',
                },
                {
                  label: 'Maximum speed',
                  playerValue: stats.estimatedMaxSpeedKmH,
                  averageValue: comparisonStats.maxSpeed,
                  unit: 'km/h',
                },
              ].map((metric) => {
                const scale = Math.max(
                  metric.playerValue,
                  metric.averageValue,
                  0.01
                );

                return (
                  <div
                    key={metric.label}
                    style={{
                      marginBottom: 'var(--space-5)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap',
                        marginBottom: 'var(--space-3)',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--off-white)',
                          fontWeight: 600,
                          fontSize: '14px',
                        }}
                      >
                        {metric.label}
                      </span>

                      <span
                        style={{
                          color: 'var(--slate-gray)',
                          fontSize: '12px',
                        }}
                      >
                        Player / Average
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 70px',
                        gap: 'var(--space-3)',
                        alignItems: 'center',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{
                            width: `${
                              (metric.playerValue / scale) * 100
                            }%`,
                          }}
                        />
                      </div>

                      <span
                        style={{
                          textAlign: 'right',
                          fontSize: '13px',
                          color: 'var(--off-white)',
                          fontWeight: 700,
                        }}
                      >
                        {formatNumber(metric.playerValue)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) 70px',
                        gap: 'var(--space-3)',
                        alignItems: 'center',
                      }}
                    >
                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{
                            width: `${
                              (metric.averageValue / scale) * 100
                            }%`,
                            opacity: 0.45,
                          }}
                        />
                      </div>

                      <span
                        style={{
                          textAlign: 'right',
                          fontSize: '13px',
                          color: 'var(--slate-gray)',
                        }}
                      >
                        {formatNumber(metric.averageValue)}
                      </span>
                    </div>

                    <p
                      style={{
                        ...mutedTextStyle,
                        fontSize: '12px',
                        marginTop: 'var(--space-2)',
                      }}
                    >
                      Unit: {metric.unit}
                    </p>
                  </div>
                );
              })}

              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  flexWrap: 'wrap',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--border-subtle)',
                  ...mutedTextStyle,
                  fontSize: '12px',
                }}
              >
                <span>■ Player: highlighted bar</span>
                <span>■ Dataset average: faded bar</span>
              </div>
            </div>
          </section>

          {/* Heatmap and Zone Occupancy */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {/* Heatmap */}
            <section style={{ minWidth: 0 }}>
              <div style={sectionTitleStyle}>
                <Target
                  size={21}
                  style={sectionIconStyle}
                />

                <h3 className="text-card-title">
                  Movement Heatmap
                </h3>
              </div>

              <PitchMap
                frame={midFrame}
                showOpponent={false}
                highlightPlayerId={selectedPlayerId}
                heatmapPoints={stats.heatmapPoints}
              />

              <p
                style={{
                  ...mutedTextStyle,
                  marginTop: 'var(--space-3)',
                  fontSize: '12px',
                }}
              >
                The heatmap visualizes the recorded demo
                positions and their relative intensity. It is
                not a time-filtered live tracking view.
              </p>
            </section>

            {/* Zone Occupancy */}
            <section style={{ minWidth: 0 }}>
              <div style={sectionTitleStyle}>
                <Layers
                  size={21}
                  style={sectionIconStyle}
                />

                <h3 className="text-card-title">
                  Playing Zones
                </h3>
              </div>

              <div
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-5)',
                }}
              >
                {stats.zoneOccupancy.map((zone) => {
                  const isPrimary =
                    zone.zone === primaryZone;

                  return (
                    <div key={zone.zone}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          marginBottom: 'var(--space-2)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isPrimary
                                ? 'var(--tactical-lime)'
                                : 'var(--off-white)',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {zone.zone}
                          </span>

                          {isPrimary && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--green-50)',
                                color: 'var(--tactical-lime)',
                                flexShrink: 0,
                              }}
                            >
                              MAIN
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--off-white)',
                            flexShrink: 0,
                          }}
                        >
                          {zone.percentage}%
                        </span>
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress-bar__fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                (zone.percentage /
                                  maxZonePercentage) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <p
                    style={{
                      color: 'var(--slate-gray)',
                      fontSize: '12px',
                      marginBottom: 4,
                    }}
                  >
                    Most occupied recorded zone
                  </p>

                  <p
                    style={{
                      color: 'var(--tactical-lime)',
                      fontWeight: 700,
                      fontSize: '16px',
                    }}
                  >
                    {primaryZone}
                  </p>

                  <p
                    style={{
                      ...mutedTextStyle,
                      fontSize: '12px',
                      marginTop: 4,
                    }}
                  >
                    {primaryZonePercentage}% recorded occupancy
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Team Shape */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <div style={sectionTitleStyle}>
              <Users
                size={21}
                style={sectionIconStyle}
              />

              <h3 className="text-card-title">
                Position Relative to Team Shape
              </h3>
            </div>

            <PitchMap
              frame={midFrame}
              showCompactness={true}
              highlightPlayerId={selectedPlayerId}
            />

            <p
              style={{
                ...mutedTextStyle,
                fontSize: '12px',
                marginTop: 'var(--space-3)',
              }}
            >
              This pitch view uses the current demo frame.
              It does not yet show the player's positional
              evolution throughout the match.
            </p>
          </section>

          {/* Tactical Insights */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <div style={sectionTitleStyle}>
              <TrendingUp
                size={21}
                style={sectionIconStyle}
              />

              <h3 className="text-card-title">
                Tactical Insights Involving This Player
              </h3>
            </div>

            {relatedInsights.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                {relatedInsights.map((insight) => (
                  <button
                    key={insight.id}
                    type="button"
                    onClick={() => onOpenEvidence(insight)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      font: 'inherit',
                      color: 'inherit',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    <div
                      className="card card-compact"
                      style={{
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.borderColor =
                          'var(--tactical-lime)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.borderColor =
                          'var(--border-subtle)';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 'var(--space-4)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              color: 'var(--off-white)',
                              lineHeight: 1.6,
                              marginBottom: 'var(--space-2)',
                            }}
                          >
                            {insight.statement}
                          </p>

                          <p
                            style={{
                              ...mutedTextStyle,
                              marginBottom: 'var(--space-3)',
                            }}
                          >
                            {insight.metric}
                          </p>

                          {insight.formulaExplanation && (
                            <p
                              style={{
                                ...mutedTextStyle,
                                fontSize: '12px',
                                marginBottom: 'var(--space-3)',
                              }}
                            >
                              {insight.formulaExplanation}
                            </p>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 'var(--space-2)',
                            }}
                          >
                            <ConfidenceBadge
                              confidence={insight.confidence}
                            />

                            <DataQualityBadge
                              quality={insight.dataQuality}
                            />

                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--slate-gray)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Clock size={13} />
                              {insight.interval.start}
                              {' – '}
                              {insight.interval.end}
                            </span>
                          </div>

                          {insight.limitations && (
                            <div
                              style={{
                                marginTop: 'var(--space-3)',
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-surface)',
                                fontSize: '12px',
                                color: 'var(--slate-gray)',
                                lineHeight: 1.6,
                              }}
                            >
                              <strong
                                style={{
                                  color: 'var(--off-white)',
                                }}
                              >
                                Limitation:{' '}
                              </strong>

                              {insight.limitations}
                            </div>
                          )}
                        </div>

                        <ArrowRight
                          size={19}
                          style={{
                            color: 'var(--tactical-lime)',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="card"
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                }}
              >
                <Target
                  size={30}
                  style={{
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-3)',
                  }}
                />

                <p
                  style={{
                    color: 'var(--off-white)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  No linked tactical insights
                </p>

                <p style={mutedTextStyle}>
                  The current dataset does not contain any
                  tactical insights linked to this player.
                </p>
              </div>
            )}
          </section>

          {/* Data Scope Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <Info
              size={17}
              style={{
                color: 'var(--slate-gray)',
                flexShrink: 0,
                marginTop: 2,
              }}
            />

            <div>
              <p
                style={{
                  color: 'var(--off-white)',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Current analysis scope
              </p>

              <p
                style={{
                  ...mutedTextStyle,
                  fontSize: '12px',
                }}
              >
                This page currently uses the project's demo
                player statistics and a fixed pitch frame.
                Zone occupancy, heatmap positions, and movement
                metrics should be treated as illustrative until
                connected to validated match tracking data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};