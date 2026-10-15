import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  AlertCircle,
} from 'lucide-react';

interface ClipPlayerProps {
  clipRef: string;
  interval?: {
    start: string;
    end: string;
  };
  title?: string;
  src?: string;
}

const parseTime = (value?: string): number | undefined => {
  if (!value) return undefined;

  const parts = value.split(':').map(Number);

  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return undefined;
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] * 3600 + parts[1] * 60 + parts[2];
};

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(remainingSeconds).padStart(2, '0');

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
};

export const ClipPlayer: React.FC<ClipPlayerProps> = ({
  clipRef,
  interval,
  title,
  src,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const clipStart = parseTime(interval?.start);
  const clipEnd = parseTime(interval?.end);

  React.useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);

    video.pause();
    video.load();
  }, [src]);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video || !src || hasError) return;

    if (video.paused) {
      try {
        if (
          clipEnd !== undefined &&
          video.currentTime >= clipEnd
        ) {
          video.currentTime = clipStart ?? 0;
        }

        await video.play();
      } catch (error) {
        console.error('Unable to play video:', error);
      }
    } else {
      video.pause();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(video.currentTime);

    if (
      clipEnd !== undefined &&
      video.currentTime >= clipEnd
    ) {
      video.pause();
      video.currentTime = clipEnd;
      setCurrentTime(clipEnd);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    setDuration(video.duration);

    if (
      clipStart !== undefined &&
      Number.isFinite(clipStart) &&
      clipStart < video.duration
    ) {
      video.currentTime = clipStart;
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;

    if (!video || !Number.isFinite(video.duration)) return;

    const newTime = Number(event.target.value);

    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFullscreen = async () => {
    const container = containerRef.current;

    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error('Unable to enter fullscreen:', error);
    }
  };

  const effectiveDuration =
    clipEnd !== undefined && Number.isFinite(duration)
      ? Math.min(clipEnd, duration)
      : duration;

  const progressMax =
    effectiveDuration > 0 ? effectiveDuration : 0;

  const progressValue = Math.min(
    currentTime,
    progressMax || currentTime
  );

  return (
    <div
      ref={containerRef}
      style={{
        background: '#0B1220',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '16 / 9',
        width: '100%',
        border: '1px solid var(--border-default)',
        color: 'var(--off-white)',
      }}
    >
      {src && !hasError ? (
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => {
            setHasError(true);
            setIsPlaying(false);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            background: '#05080D',
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '24px',
            boxSizing: 'border-box',
            textAlign: 'center',
            gap: '12px',
            color: 'var(--text-muted)',
          }}
        >
          {hasError ? (
            <AlertCircle
              size={36}
              color="#F2B84B"
            />
          ) : (
            <Play
              size={36}
              color="var(--tactical-lime)"
            />
          )}

          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--off-white)',
            }}
          >
            {title || 'Match Clip'}
          </span>

          <span style={{ fontSize: '13px', maxWidth: '90%' }}>
            {hasError
              ? 'Unable to load the video. Check the video path and format.'
              : 'Video source not configured. Connect a match video to enable playback.'}
          </span>

          <span
            style={{
              fontSize: '12px',
              opacity: 0.7,
            }}
          >
            Reference: {clipRef}
          </span>
        </div>
      )}

      {/* Video controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 16px 12px',
          background:
            'linear-gradient(transparent, rgba(0,0,0,0.9))',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={progressMax || 1}
          step="0.1"
          value={progressMax > 0 ? progressValue : 0}
          disabled={!src || hasError || duration <= 0}
          onChange={handleSeek}
          aria-label="Video progress"
          style={{
            width: '100%',
            accentColor: 'var(--tactical-lime)',
            cursor: src ? 'pointer' : 'default',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: 0,
            }}
          >
            <button
              type="button"
              onClick={togglePlayback}
              disabled={!src || hasError}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--off-white)',
                cursor: src ? 'pointer' : 'not-allowed',
                padding: 2,
              }}
            >
              {isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>

            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              {formatTime(currentTime)}
              {' / '}
              {formatTime(duration)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                const video = videoRef.current;

                if (!video) return;

                video.muted = !video.muted;
                setIsMuted(video.muted);
              }}
              disabled={!src || hasError}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--off-white)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              {isMuted ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>

            <button
              type="button"
              onClick={handleFullscreen}
              aria-label="Toggle fullscreen"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--off-white)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};