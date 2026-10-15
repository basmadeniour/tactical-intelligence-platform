import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
} from "lucide-react";

import { PitchMap } from "./PitchMap";

import {
  getFrameAtIndex,
  getFrameCount,
} from "../../services/simulationEngine";

import type { PitchFrame } from "../../types/tactical";

interface TrackingReplayProps {
  startSec?: number;
  endSec?: number;
  showCompactness?: boolean;
  showLines?: boolean;
}

const FRAME_DURATION_MS = 1000 / 25;

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");

  const remainder = (safeSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainder}`;
};

export const TrackingReplay: React.FC<TrackingReplayProps> = ({
  startSec,
  endSec,
  showCompactness = false,
  showLines = false,
}) => {
  const totalFrames = getFrameCount();

  /**
   * Read the available frame timestamps.
   *
   * The current sample may cover only a few seconds of the match.
   * Insight timestamps can therefore fall outside the sample.
   */
  const frameTimes = React.useMemo(() => {
    const times: number[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const frame = getFrameAtIndex(i);

      if (frame) {
        times.push(frame.timeSec);
      }
    }

    return times;
  }, [totalFrames]);

  const sampleStartSec = frameTimes[0] ?? 0;
  const sampleEndSec =
    frameTimes[frameTimes.length - 1] ?? 0;

  const findClosestIndex = useCallback(
    (timeSec?: number): number => {
      if (
        totalFrames === 0 ||
        timeSec === undefined ||
        frameTimes.length === 0
      ) {
        return 0;
      }

      let closestIndex = 0;
      let smallestDifference = Infinity;

      for (let i = 0; i < frameTimes.length; i++) {
        const difference = Math.abs(
          frameTimes[i] - timeSec
        );

        if (difference < smallestDifference) {
          smallestDifference = difference;
          closestIndex = i;
        }
      }

      return closestIndex;
    },
    [totalFrames, frameTimes]
  );

  /**
   * Check whether the selected Insight interval overlaps
   * the actual time range represented by the tracking sample.
   */
  const hasRequestedInterval =
    startSec !== undefined &&
    endSec !== undefined &&
    startSec <= sampleEndSec &&
    endSec >= sampleStartSec;

  /**
   * If the requested interval is available, replay that interval.
   * Otherwise, replay the entire available sample.
   *
   * Important: replaying the sample is only a fallback.
   * It does not mean the sample belongs to the selected Insight.
   */
  const firstIndex = hasRequestedInterval
    ? Math.min(
        findClosestIndex(startSec),
        findClosestIndex(endSec)
      )
    : 0;

  const lastIndex = hasRequestedInterval
    ? Math.max(
        findClosestIndex(startSec),
        findClosestIndex(endSec)
      )
    : Math.max(0, totalFrames - 1);

  const [frameIndex, setFrameIndex] = useState(firstIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const frameIndexRef = useRef(firstIndex);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    lastTickRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    cancelAnimation();
    accumulatorRef.current = 0;
  }, [cancelAnimation]);

  // Keep the current frame reference synchronized.
  useEffect(() => {
    frameIndexRef.current = frameIndex;
  }, [frameIndex]);

  // Reset playback when the selected range changes.
  useEffect(() => {
    cancelAnimation();

    frameIndexRef.current = firstIndex;
    setFrameIndex(firstIndex);
    setIsPlaying(false);
    accumulatorRef.current = 0;
  }, [firstIndex, lastIndex, cancelAnimation]);

  // Playback loop.
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) {
      return;
    }

    if (frameIndexRef.current >= lastIndex) {
      frameIndexRef.current = firstIndex;
      setFrameIndex(firstIndex);
    }

    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) {
        return;
      }

      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }

      const delta = Math.min(
        now - lastTickRef.current,
        250
      );

      lastTickRef.current = now;
      accumulatorRef.current += delta * speed;

      const steps = Math.floor(
        accumulatorRef.current / FRAME_DURATION_MS
      );

      if (steps > 0) {
        accumulatorRef.current -=
          steps * FRAME_DURATION_MS;

        const nextIndex = Math.min(
          frameIndexRef.current + steps,
          lastIndex
        );

        frameIndexRef.current = nextIndex;
        setFrameIndex(nextIndex);

        if (nextIndex >= lastIndex) {
          setIsPlaying(false);
          accumulatorRef.current = 0;
          animationRef.current = null;
          lastTickRef.current = null;
          return;
        }
      }

      animationRef.current =
        window.requestAnimationFrame(tick);
    };

    lastTickRef.current = null;

    animationRef.current =
      window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimation();
    };
  }, [
    isPlaying,
    speed,
    totalFrames,
    firstIndex,
    lastIndex,
    cancelAnimation,
  ]);

  const frame: PitchFrame | null =
    getFrameAtIndex(frameIndex);

  const handlePlayPause = () => {
    console.log(
      `[TrackingReplay] Play/Pause clicked | ` +
        `isPlaying=${isPlaying} | ` +
        `frameIndex=${frameIndexRef.current} | ` +
        `firstIndex=${firstIndex} | ` +
        `lastIndex=${lastIndex} | ` +
        `totalFrames=${totalFrames} | ` +
        `hasRequestedInterval=${hasRequestedInterval}`
    );

    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (totalFrames <= 1 || firstIndex >= lastIndex) {
      console.warn(
        "[TrackingReplay] Playback unavailable: " +
          "not enough frames in the selected sequence."
      );

      return;
    }

    cancelAnimation();
    accumulatorRef.current = 0;

    // Start again from the beginning when playback has ended.
    if (frameIndexRef.current >= lastIndex) {
      frameIndexRef.current = firstIndex;
      setFrameIndex(firstIndex);
    }

    setIsPlaying(true);
  };

  const handleRestart = () => {
    console.log("[TrackingReplay] Restart clicked");

    stopPlayback();

    frameIndexRef.current = firstIndex;
    setFrameIndex(firstIndex);
  };

  const handleSeek = (value: number) => {
    stopPlayback();

    const safeIndex = Math.max(
      firstIndex,
      Math.min(value, lastIndex)
    );

    frameIndexRef.current = safeIndex;
    setFrameIndex(safeIndex);
  };

  const handleSpeedChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSpeed = Number(event.target.value);

    console.log(
      "[TrackingReplay] Speed changed:",
      newSpeed
    );

    setSpeed(newSpeed);
  };

  if (totalFrames === 0 || !frame) {
    return (
      <div className="card">
        Tracking data is unavailable. Check that
        tracking_sample.json contains at least one valid frame.
      </div>
    );
  }

  const durationLabel = hasRequestedInterval
    ? `Insight: ${formatTime(startSec ?? 0)} – ${formatTime(
        endSec ?? frame.timeSec
      )}`
    : `Available sample: ${formatTime(
        sampleStartSec
      )} – ${formatTime(sampleEndSec)}`;

  return (
    <div
      className="card"
      style={{
        padding: "var(--space-4)",
        background: "var(--bg-surface)",
      }}
    >
      {/* Replay header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--off-white)",
            }}
          >
            Tracking Replay
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            Player and ball positions from tracking data
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            color: "var(--tactical-lime)",
            border: "1px solid var(--border-default)",
            borderRadius: 20,
            padding: "5px 10px",
          }}
        >
          {frame.phaseLabel}
        </span>
      </div>

      {/* Sample availability notice */}
      {!hasRequestedInterval &&
        (startSec !== undefined || endSec !== undefined) && (
          <div
            role="status"
            style={{
              marginBottom: 14,
              padding: "10px 12px",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: 4,
                color: "var(--tactical-lime)",
              }}
            >
              Insight interval not available in this sample
            </strong>

            The selected Insight covers{" "}
            {formatTime(startSec ?? 0)} –{" "}
            {formatTime(endSec ?? sampleEndSec)}, but the
            current tracking sample covers only{" "}
            {formatTime(sampleStartSec)} –{" "}
            {formatTime(sampleEndSec)}. The replay below uses
            the available sample for demonstration; it is not
            a reconstruction of the selected Insight interval.
          </div>
        )}

      {/* Pitch */}
      <PitchMap
        frame={frame}
        showOpponent
        showCompactness={showCompactness}
        showLines={showLines}
      />

      {/* Timeline */}
      <div style={{ marginTop: 16 }}>
        <input
          aria-label="Tracking replay timeline"
          type="range"
          min={firstIndex}
          max={Math.max(firstIndex, lastIndex)}
          step={1}
          value={Math.max(
            firstIndex,
            Math.min(frameIndex, lastIndex)
          )}
          onChange={(event) => {
            handleSeek(Number(event.target.value));
          }}
          style={{
            width: "100%",
            accentColor: "var(--tactical-lime)",
            cursor: "pointer",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <span>{frame.timestamp}</span>

          <span>
            Frame {frameIndex + 1} / {totalFrames}
          </span>

          <span>{durationLabel}</span>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          disabled={totalFrames <= 1 || firstIndex >= lastIndex}
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}

          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleRestart}
        >
          <RotateCcw size={16} />
          Restart
        </button>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text-secondary)",
            fontSize: 13,
          }}
        >
          <FastForward size={16} />
          Speed

          <select
            aria-label="Playback speed"
            value={speed}
            onChange={handleSpeedChange}
            style={{
              color: "var(--off-white)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              padding: "7px 10px",
            }}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>
      </div>

      {/* Data disclaimer */}
      <div
        style={{
          marginTop: 14,
          lineHeight: 1.6,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        This is a 2D reconstruction from tracking coordinates,
        not original match footage. Playback follows the order
        of frames in the source file.

        {!hasRequestedInterval &&
          (startSec !== undefined || endSec !== undefined) &&
          " The available sample does not contain the selected Insight's original time interval."}
      </div>
    </div>
  );
};

