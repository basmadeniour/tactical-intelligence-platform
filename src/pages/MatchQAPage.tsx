import React, { useEffect, useRef, useState } from 'react';

import {
  CURRENT_MATCH,
  MATCH_CHUNKS,
  INSIGHTS,
  HALFTIME_FINDINGS,
  HALFTIME_OPTIONS,
  SUGGESTED_QUESTIONS,
  QA_DATABASE,
} from '../data/demoData';

import { Insight, QAEntry } from '../types/tactical';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { DataQualityBadge } from '../components/shared/DataQualityBadge';

import {
  Upload,
  CheckCircle2,
  Film,
  Clock,
  ChevronRight,
  MessageSquare,
  Send,
  AlertTriangle,
  Zap,
  Target,
  ArrowRight,
  FileVideo,
  X,
  Play,
  Users,
  CalendarDays,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

interface MatchQAPageProps {
  onOpenEvidence: (insight: Insight) => void;
}

const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const phaseColor = (key: string) => {
  switch (key) {
    case 'attacking':
    case 'attacking_transition':
      return 'var(--tactical-lime)';

    case 'defensive':
    case 'defensive_transition':
      return 'var(--alert-amber)';

    case 'pressing':
      return 'var(--pitch-green)';

    default:
      return 'var(--slate-gray)';
  }
};

export const MatchQAPage: React.FC<MatchQAPageProps> = ({
  onOpenEvidence,
}) => {
  const [questionInput, setQuestionInput] = useState('');
  const [activeQA, setActiveQA] = useState<QAEntry | null>(null);
  const [showNoEvidence, setShowNoEvidence] = useState(false);

  // User-uploaded match state.
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [showUploadDetails, setShowUploadDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const getInsightById = (id: string) =>
    INSIGHTS.find((insight) => insight.id === id);

  const handleAskQuestion = (question: string) => {
    setShowNoEvidence(false);

    const normalizedQuestion = question.toLowerCase().trim();

    const found = QA_DATABASE.find((qa) => {
      const normalizedStoredQuestion = qa.question.toLowerCase();

      return (
        normalizedStoredQuestion === normalizedQuestion ||
        normalizedQuestion.includes(
          normalizedStoredQuestion.replace('?', '')
        )
      );
    });

    if (found) {
      setActiveQA(found);
    } else {
      setActiveQA(null);
      setShowNoEvidence(true);
    }

    setQuestionInput('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (questionInput.trim()) {
      handleAskQuestion(questionInput.trim());
    }
  };

  const handleVideoSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setUploadError('');
    setShowUploadDetails(false);

    if (!file) {
      return;
    }

    const isVideo =
      file.type.startsWith('video/') ||
      /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name);

    if (!isVideo) {
      setUploadError(
        'Please select a valid video file, such as MP4 or MOV.'
      );

      event.target.value = '';
      return;
    }

    if (file.size === 0) {
      setUploadError('The selected file is empty.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setUploadError(
        'The selected video exceeds the 2 GB prototype limit.'
      );

      event.target.value = '';
      return;
    }

    setSelectedVideo(file);

    setVideoUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return URL.createObjectURL(file);
    });
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    setUploadError('');
    setShowUploadDetails(false);

    setVideoUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return null;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePrepareAnalysis = (event: React.FormEvent) => {
    event.preventDefault();

    setUploadError('');

    if (!teamName.trim()) {
      setUploadError('Please enter your team name.');
      return;
    }

    if (!opponentName.trim()) {
      setUploadError('Please enter your opponent name.');
      return;
    }

    if (!selectedVideo) {
      setUploadError('Please select a match video first.');
      return;
    }

    /*
     * Prototype behavior:
     * The video is currently available only in the browser.
     * No server upload, tracking extraction, or AI analysis
     * happens until the backend pipeline is connected.
     */
    setShowUploadDetails(true);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1
          className="text-page-title"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          Match Chunks & Q&A
        </h1>

        <p className="text-body">
          Explore tactical evidence from a match, or prepare your
          own team's video for analysis.

          <span
            style={{
              color: 'var(--text-muted)',
              marginLeft: 'var(--space-3)',
            }}
          >
            Tactical Intelligence Platform
          </span>
        </p>
      </div>

      {/* Upload Your Own Match */}
      <section
        className="card"
        style={{
          marginBottom: 'var(--space-8)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                color: 'var(--tactical-lime)',
              }}
            >
              <Target size={24} />
            </div>

            <div>
              <h2
                className="text-card-title"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                Analyze Your Team
              </h2>

              <p
                style={{
                  fontSize: 'var(--size-body-sm)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  maxWidth: 600,
                }}
              >
                Upload your own match footage and prepare it for
                tactical analysis. Your team's match details stay
                separate from the demonstration data below.
              </p>
            </div>
          </div>

          <span
            className="tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 10px',
            }}
          >
            <Film size={14} />
            Video workspace
          </span>
        </div>

        <form onSubmit={handlePrepareAnalysis}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {/* Team name */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--size-body-sm)',
                  fontWeight: 600,
                  color: 'var(--off-white)',
                }}
              >
                Your Team
              </span>

              <div style={{ position: 'relative' }}>
                <Users
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />

                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Terra Nova FC"
                  value={teamName}
                  onChange={(event) =>
                    setTeamName(event.target.value)
                  }
                  maxLength={100}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: 38,
                  }}
                />
              </div>
            </label>

            {/* Opponent */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
                <span
                  style={{
                    fontSize: 'var(--size-body-sm)',
                    fontWeight: 600,
                    color: 'var(--off-white)',
                  }}
                >
                  Opponent
                </span>

                <div style={{ position: 'relative' }}>
                  <ShieldCheck
                    size={17}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  />

                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Opponent FC"
                    value={opponentName}
                    onChange={(event) =>
                      setOpponentName(event.target.value)
                    }
                    maxLength={100}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      paddingLeft: 38,
                    }}
                  />
                </div>
            </label>

            {/* Match date */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--size-body-sm)',
                  fontWeight: 600,
                  color: 'var(--off-white)',
                }}
              >
                Match Date
              </span>

              <div style={{ position: 'relative' }}>
                <CalendarDays
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />

                <input
                  className="input"
                  type="date"
                  value={matchDate}
                  onChange={(event) =>
                    setMatchDate(event.target.value)
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: 38,
                  }}
                />
              </div>
            </label>
          </div>

          {/* Video selection */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.m4v,.webm,.avi,.mkv"
            onChange={handleVideoSelection}
            style={{ display: 'none' }}
            aria-label="Select match video"
          />

          {!selectedVideo ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                minHeight: 180,
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-3)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                color: 'var(--off-white)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-surface)',
                  color: 'var(--tactical-lime)',
                }}
              >
                <Upload size={24} />
              </div>

              <span
                style={{
                  fontWeight: 700,
                  fontSize: 'var(--size-body)',
                }}
              >
                Select Match Video
              </span>

              <span
                style={{
                  fontSize: 'var(--size-body-sm)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Choose a video from your device
                <br />
                MP4, MOV, WebM and other common formats
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                Prototype limit: 2 GB
              </span>
            </button>
          ) : (
            <div
              style={{
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/* Video preview */}
              {videoUrl && (
                <video
                  src={videoUrl}
                  controls
                  preload="metadata"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 380,
                    background: '#000',
                  }}
                >
                  Your browser does not support video playback.
                </video>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  flexWrap: 'wrap',
                }}
              >
                <FileVideo
                  size={24}
                  style={{
                    color: 'var(--tactical-lime)',
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--size-body-sm)',
                      fontWeight: 600,
                      color: 'var(--off-white)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {selectedVideo.name}
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    {formatFileSize(selectedVideo.size)}
                    {' · '}
                    Selected locally
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleRemoveVideo}
                  aria-label="Remove selected video"
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                border: '1px solid var(--amber-200)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--amber-50)',
                color: 'var(--alert-amber)',
                fontSize: 'var(--size-body-sm)',
                lineHeight: 1.6,
              }}
            >
              <AlertTriangle
                size={18}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              {uploadError}
            </div>
          )}

          {/* Prepare analysis */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              marginTop: 'var(--space-5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                flex: '1 1 250px',
              }}
            >
              <HardDrive
                size={16}
                style={{
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Selecting a video previews it in your browser.
                It is not uploaded to a server yet.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedVideo}
              style={{
                opacity: selectedVideo ? 1 : 0.5,
              }}
            >
              <Play size={16} />
              Prepare Analysis
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Prototype status */}
        {showUploadDetails && selectedVideo && (
          <div
            role="status"
            style={{
              marginTop: 'var(--space-5)',
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <CheckCircle2
                size={22}
                style={{ color: 'var(--success-green)' }}
              />

              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--size-body)',
                    fontWeight: 700,
                    color: 'var(--off-white)',
                  }}
                >
                  Video selected successfully
                </h3>

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}
                >
                  {teamName} vs {opponentName}
                  {matchDate ? ` · ${matchDate}` : ''}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                fontSize: 'var(--size-body-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}
            >
              <AlertTriangle
                size={18}
                style={{
                  color: 'var(--alert-amber)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />

              <p>
                Your video is ready for the next integration step.
                Actual tactical analysis requires a backend pipeline
                to process the video, extract player tracking data,
                and calculate tactical metrics. No analysis has
                been run on this video yet.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Existing Demo Match */}
      <div
        className="card card-compact"
        style={{ marginBottom: 'var(--space-8)' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <Film
              size={18}
              style={{ color: 'var(--success-green)' }}
            />

            <div>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--size-body-sm)',
                  fontWeight: 600,
                  color: 'var(--off-white)',
                }}
              >
                Demonstration Match
              </span>

              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                }}
              >
                {CURRENT_MATCH.homeTeam} {CURRENT_MATCH.homeScore}
                {' – '}
                {CURRENT_MATCH.awayScore} {CURRENT_MATCH.awayTeam}
              </p>
            </div>

            <CheckCircle2
              size={18}
              style={{ color: 'var(--success-green)' }}
            />
          </div>

          <div className="demo-notice">
            Simulated demo data
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 400px)',
          gap: 'var(--space-8)',
          alignItems: 'start',
        }}
      >
        {/* Left: Timeline + Halftime */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-8)',
            minWidth: 0,
          }}
        >
          {/* Halftime Summary */}
          <div
            className="card"
            style={{
              background: 'var(--green-50)',
              borderColor: 'var(--green-200)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <Target
                size={22}
                style={{ color: 'var(--tactical-lime)' }}
              />

              <h2
                className="text-card-title"
                style={{ color: 'var(--tactical-lime)' }}
              >
                Halftime Summary
              </h2>
            </div>

            <div style={{ marginBottom: 'var(--space-5)' }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--tactical-lime)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Key First-Half Findings
              </div>

              {HALFTIME_FINDINGS.map((insight) => (
                <div
                  key={insight.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenEvidence(insight)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      onOpenEvidence(insight);
                    }
                  }}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    marginBottom: 'var(--space-3)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor =
                      'var(--tactical-lime)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor =
                      'var(--border-default)';
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--size-body-sm)',
                      fontWeight: 600,
                      color: 'var(--off-white)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    {insight.statement}
                  </p>

                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 16,
                      color: 'var(--slate-gray)',
                    }}
                  >
                    {insight.metric}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-2)',
                      marginTop: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <ConfidenceBadge
                      confidence={insight.confidence}
                    />

                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                        color: 'var(--text-tertiary)',
                        fontWeight: 500,
                      }}
                    >
                      <Clock
                        size={12}
                        style={{
                          display: 'inline',
                          verticalAlign: 'middle',
                          marginRight: 3,
                        }}
                      />
                      {insight.interval.start}
                      {' – '}
                      {insight.interval.end}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4) var(--space-5)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Candidate Adjustments — Options
              </div>

              {HALFTIME_OPTIONS.map((option, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)',
                    marginBottom:
                      index < HALFTIME_OPTIONS.length - 1
                        ? 'var(--space-3)'
                        : 0,
                  }}
                >
                  <ChevronRight
                    size={16}
                    style={{
                      color: 'var(--tactical-lime)',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />

                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--size-body-sm)',
                      color: 'var(--slate-gray)',
                    }}
                  >
                    {option}
                  </p>
                </div>
              ))}

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginTop: 'var(--space-4)',
                }}
              >
                Final decision belongs to the coach.
              </p>
            </div>
          </div>

          {/* Match Timeline */}
          <div>
            <h2
              className="text-section-title"
              style={{ marginBottom: 'var(--space-5)' }}
            >
              Match Timeline
            </h2>

            <div
              className="stagger-children"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {MATCH_CHUNKS.map((chunk) => {
                const chunkInsights = chunk.insightIds
                  .map(getInsightById)
                  .filter(Boolean) as Insight[];

                const isUncertain =
                  chunk.dataQuality === 'Uncertain';

                return (
                  <div
                    key={chunk.id}
                    className="card card-compact"
                    style={{
                      borderLeft: `4px solid ${phaseColor(
                        chunk.phaseKey
                      )}`,
                      ...(isUncertain
                        ? {
                            background: 'var(--amber-50)',
                            borderColor: 'var(--alert-amber)',
                          }
                        : {}),
                    }}
                  >
                    {isUncertain && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--alert-amber)',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        <AlertTriangle size={14} />
                        Data quality uncertain for this interval
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 'var(--space-4)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'var(--size-body)',
                            fontWeight: 700,
                            color: 'var(--off-white)',
                            marginBottom: 'var(--space-2)',
                          }}
                        >
                          {chunk.title}
                        </h3>

                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--size-body-sm)',
                            color: 'var(--slate-gray)',
                            marginBottom: 'var(--space-3)',
                          }}
                        >
                          {chunk.summary}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: 14,
                              color: 'var(--text-tertiary)',
                              fontWeight: 500,
                            }}
                          >
                            <Clock
                              size={12}
                              style={{
                                display: 'inline',
                                verticalAlign: 'middle',
                                marginRight: 3,
                              }}
                            />
                            {chunk.interval.start}
                            {' – '}
                            {chunk.interval.end}
                          </span>

                          <DataQualityBadge
                            quality={chunk.dataQuality}
                          />

                          {chunk.keyMetrics.map(
                            (metric, index) => (
                              <span
                                key={index}
                                className="tag"
                              >
                                {metric}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {chunkInsights.length > 0 && (
                      <div
                        style={{
                          marginTop: 'var(--space-4)',
                          paddingTop: 'var(--space-4)',
                          borderTop:
                            '1px solid var(--border-subtle)',
                        }}
                      >
                        {chunkInsights.map((insight) => (
                          <div
                            key={insight.id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              onOpenEvidence(insight)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === 'Enter' ||
                                event.key === ' '
                              ) {
                                event.preventDefault();
                                onOpenEvidence(insight);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 'var(--space-3)',
                              padding:
                                'var(--space-3) var(--space-4)',
                              background: 'var(--bg-elevated)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              marginBottom: 'var(--space-2)',
                              transition: 'all 0.15s',
                              border: '1px solid transparent',
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.borderColor =
                                'var(--tactical-lime)';
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.borderColor =
                                'transparent';
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontFamily: 'var(--font-body)',
                                  fontSize: 'var(--size-body-sm)',
                                  fontWeight: 600,
                                  color: 'var(--off-white)',
                                }}
                              >
                                {insight.statement}
                              </p>

                              <div
                                style={{
                                  display: 'flex',
                                  gap: 'var(--space-2)',
                                  marginTop: 'var(--space-1)',
                                }}
                              >
                                <ConfidenceBadge
                                  confidence={insight.confidence}
                                />
                              </div>
                            </div>

                            <ArrowRight
                              size={16}
                              style={{
                                color: 'var(--tactical-lime)',
                                flexShrink: 0,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Q&A Panel */}
        <div
          style={{
            position: 'sticky',
            top: 'var(--space-8)',
            minWidth: 0,
          }}
        >
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 120px)',
              minHeight: 520,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <MessageSquare
                size={22}
                style={{ color: 'var(--tactical-lime)' }}
              />

              <h2 className="text-card-title">
                Ask About This Match
              </h2>
            </div>

            {/* Suggested questions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'flex-start',
                    fontSize: 14,
                    padding: 'var(--space-3) var(--space-4)',
                    textAlign: 'left',
                  }}
                  onClick={() => handleAskQuestion(question)}
                >
                  <Zap
                    size={14}
                    style={{ color: 'var(--tactical-lime)' }}
                  />

                  {question}
                </button>
              ))}
            </div>

            <div className="divider" />

            {/* Answer area */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                marginBottom: 'var(--space-4)',
              }}
            >
              {activeQA && (
                <div className="animate-fade-in-up">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--pitch-green)',
                        color: 'var(--off-white)',
                        padding:
                          'var(--space-3) var(--space-5)',
                        borderRadius:
                          'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--size-body-sm)',
                        fontWeight: 500,
                        maxWidth: '85%',
                      }}
                    >
                      {activeQA.question}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      padding: 'var(--space-5)',
                      borderRadius:
                        'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--size-body-sm)',
                      color: 'var(--slate-gray)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    {activeQA.answer}
                  </div>

                  {activeQA.supportingInsightIds.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          marginBottom: 'var(--space-2)',
                        }}
                      >
                        Supporting Evidence
                      </div>

                      {activeQA.supportingInsightIds.map((id) => {
                        const insight = getInsightById(id);

                        if (!insight) {
                          return null;
                        }

                        return (
                          <div
                            key={id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              onOpenEvidence(insight)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === 'Enter' ||
                                event.key === ' '
                              ) {
                                event.preventDefault();
                                onOpenEvidence(insight);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              padding:
                                'var(--space-3) var(--space-4)',
                              background: 'var(--bg-elevated)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              marginBottom: 'var(--space-1)',
                              fontFamily: 'var(--font-heading)',
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--tactical-lime)',
                              transition: 'background 0.15s',
                              border:
                                '1px solid var(--border-subtle)',
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.background =
                                'var(--bg-surface-hover)';
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.background =
                                'var(--bg-elevated)';
                            }}
                          >
                            <ArrowRight size={14} />

                            View evidence:{' '}
                            {insight.interval.start}
                            {' – '}
                            {insight.interval.end}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {showNoEvidence && (
                <div
                  className="animate-fade-in-up"
                  style={{
                    background: 'var(--amber-50)',
                    border: '1px solid var(--amber-200)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-5)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                  }}
                >
                  <AlertTriangle
                    size={22}
                    style={{
                      color: 'var(--alert-amber)',
                      flexShrink: 0,
                    }}
                  />

                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'var(--size-body)',
                        fontWeight: 600,
                        color: 'var(--alert-amber)',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      Not enough evidence
                    </p>

                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--size-body-sm)',
                        color: 'var(--alert-amber)',
                      }}
                    >
                      Not enough evidence in the available data to
                      answer this. Try one of the suggested
                      questions above.
                    </p>
                  </div>
                </div>
              )}

              {!activeQA && !showNoEvidence && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--space-10) var(--space-5)',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  <MessageSquare
                    size={40}
                    style={{
                      marginBottom: 'var(--space-4)',
                      opacity: 0.3,
                    }}
                  />

                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--size-body-sm)',
                      fontWeight: 600,
                    }}
                  >
                    Ask a question about this match
                  </p>

                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    Answers are grounded in match data only
                  </p>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
              }}
            >
              <input
                className="input"
                type="text"
                placeholder="Ask about this match..."
                value={questionInput}
                onChange={(event) =>
                  setQuestionInput(event.target.value)
                }
                style={{ flex: 1, minWidth: 0 }}
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!questionInput.trim()}
                style={{
                  opacity: questionInput.trim() ? 1 : 0.4,
                }}
                aria-label="Send question"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

