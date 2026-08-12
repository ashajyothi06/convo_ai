import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  LogOut,
  Menu,
  MapPin,
  Mic,
  MicOff,
  Phone,
  Power,
  ShieldCheck,
  Sparkles,
  Timer,
  UserRound,
  Volume2
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  clearToken,
  endCall,
  getToken,
  getVoiceConfig,
  login,
  logout,
  me,
  sendTurn,
  setToken,
  startCall
} from "./api";

import {
  QwenRealtimeClient
} from "./qwenRealtime";

import type {
  PanditBookingSummary,
  TranscriptTurn,
  User
} from "./types";

const EMPTY_BOOKING_SUMMARY: PanditBookingSummary = {
  name: null,
  phone: null,
  service: null,
  schedule: null,
  duration: null,
  address: null
};

function LoginPage({
  onAuthenticated
}: {
  onAuthenticated:
    (user: User) => void;
}) {
  const [email, setEmail] =
    useState("demo@gyaini.ai");

  const [password, setPassword] =
    useState("ChangeMe@123");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result =
        await login(
          email,
          password
        );

      setToken(result.token);

      onAuthenticated(
        result.user
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="professional-login">
      <div className="login-background-grid" />
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <section className="login-layout">
        <div className="login-intro">
          <div className="professional-brand">
            <div className="brand-symbol">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div>
              <strong>
                Arya Samaj Seva
              </strong>

              <small>
                Pandit booking assistant
              </small>
            </div>
          </div>

          <div className="intro-content">
            <span className="intro-badge">
              <Sparkles size={14} />
              Conversational AI
            </span>

            <h1>
              Book a Pandit for
              <span>
                your sacred rituals.
              </span>
            </h1>

            <p>
              Speak naturally with Veda.
              Your appointment details are
              organized securely while the
              conversation happens.
            </p>
          </div>

          <div className="trust-list">
            <div>
              <span className="trust-icon">
                <Headphones size={18} />
              </span>

              <div>
                <strong>
                  Natural voice booking
                </strong>

                <small>
                  Tell Veda the ritual, schedule and service address.
                </small>
              </div>
            </div>

            <div>
              <span className="trust-icon">
                <ShieldCheck size={18} />
              </span>

              <div>
                <strong>
                  Private booking session
                </strong>

                <small>
                  Sign-in is required before booking details are collected.
                </small>
              </div>
            </div>
          </div>
        </div>

        <form
          className="professional-login-card"
          onSubmit={submit}
        >
          <div className="login-card-header">
            <span className="secure-icon">
              <LockKeyhole size={20} />
            </span>

            <div>
              <h2>
                Sign in
              </h2>

              <p>
                Continue to your private
                voice assistant.
              </p>
            </div>
          </div>

          <div className="login-form-fields">
            <label>
              <span>
                Email address
              </span>

              <input
                value={email}
                type="email"
                autoComplete="username"
                placeholder="name@example.com"
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label>
              <span>
                Password
              </span>

              <div className="password-field">
                <input
                  value={password}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete=
                    "current-password"
                  placeholder="Enter your password"
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>
          </div>

          {error && (
            <div className="professional-login-error">
              {error}
            </div>
          )}

          <button
            className="professional-login-button"
            disabled={loading}
            type="submit"
          >
            <span>
              {loading
                ? "Signing in…"
                : "Sign in securely"}
            </span>

            {!loading && (
              <ArrowRight size={18} />
            )}
          </button>

          <div className="login-security-note">
            <ShieldCheck size={15} />

            <span>
              Your sign-in session is
              handled by the secured
              Node-RED backend.
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}

function AppointmentRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="appointment-row">
      <div className="appointment-label">
        <span className="row-icon">
          {icon}
        </span>

        <span>
          {label}
        </span>
      </div>

      <div
        className={
          `appointment-value ${
            value
              ? "complete"
              : "pending"
          }`
        }
      >
        <span className="status-indicator">
          {value ? (
            <Check
              size={13}
              strokeWidth={3.2}
            />
          ) : null}
        </span>

        <span className="value-text">
          {value ||
            "Waiting for confirmation"}
        </span>
      </div>
    </div>
  );
}

function Avatar({
  speaking
}: {
  speaking: boolean;
}) {
  return (
    <div
      className={
        `avatar-stage ${
          speaking
            ? "speaking"
            : ""
        }`
      }
    >
      <img
        className="avatar-base"
        src="/assistant-avatar.jpg"
        alt="Veda AI assistant"
      />

      <div className="avatar-light" />
      <div className="avatar-vignette" />

      <div className="avatar-speaking-chip">
        <div
          className={
            `mini-wave ${
              speaking
                ? "active"
                : ""
            }`
          }
        >
          <span />
          <span />
          <span />
          <span />
        </div>

        <span>
          {speaking
            ? "Veda is speaking"
            : "Veda"}
        </span>
      </div>
    </div>
  );
}

function VoicePage({
  user,
  onLogout
}: {
  user: User;
  onLogout: () => void;
}) {
  const [summary, setSummary] =
    useState<PanditBookingSummary>(
      EMPTY_BOOKING_SUMMARY
    );

  const [turns, setTurns] =
    useState<TranscriptTurn[]>([]);

  const [status, setStatus] =
    useState("Ready");

  const [callId, setCallId] =
    useState<string | null>(null);

  const [connected, setConnected] =
    useState(false);

  const [starting, setStarting] =
    useState(false);

  const [muted, setMuted] =
    useState(false);

  const [
    assistantSpeaking,
    setAssistantSpeaking
  ] = useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [
    summaryOpen,
    setSummaryOpen
  ] = useState(true);

  const remoteAudioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  const clientRef =
    useRef<QwenRealtimeClient | null>(
      null
    );

  const endingRef =
    useRef(false);

  const elapsedStart =
    useRef<number | null>(
      null
    );

  const [
    elapsedSeconds,
    setElapsedSeconds
  ] = useState(0);

  useEffect(() => {
    if (
      !connected ||
      !elapsedStart.current
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setElapsedSeconds(
          Math.max(
            0,
            Math.floor(
              (
                Date.now() -
                (
                  elapsedStart.current ||
                  Date.now()
                )
              ) /
              1000
            )
          )
        );
      }, 1000);

    return () =>
      window.clearInterval(timer);
  }, [connected]);

  const elapsed =
    useMemo(() => {
      const mm =
        Math.floor(
          elapsedSeconds / 60
        )
          .toString()
          .padStart(2, "0");

      const ss =
        (
          elapsedSeconds % 60
        )
          .toString()
          .padStart(2, "0");

      return `${mm}:${ss}`;
    }, [elapsedSeconds]);

  const completedCount =
    useMemo(
      () =>
        [
          summary.name,
          summary.phone,
          summary.service,
          summary.schedule,
          summary.duration,
          summary.address
        ].filter(Boolean).length,
      [summary]
    );

  async function persistTurnWithId(
    id: string,
    turn: TranscriptTurn
  ) {
    setTurns((current) => {
      if (
        current.some(
          (item) =>
            item.turn_id ===
            turn.turn_id
        )
      ) {
        return current;
      }

      return [
        ...current,
        turn
      ];
    });

    try {
      const nextSummary =
        await sendTurn(
          id,
          turn
        );

      setSummary(
        nextSummary
      );
    } catch (error) {
      console.error(
        "Unable to update appointment summary:",
        error
      );
    }
  }

  async function startConversation() {
    if (
      starting ||
      connected
    ) {
      return;
    }

    setStarting(true);
    setStatus("Preparing…");

    try {
      const [
        voiceConfig,
        call
      ] =
        await Promise.all([
          getVoiceConfig(),
          startCall()
        ]);

      setCallId(
        call.call_id
      );

      setSummary(
        call.public_summary ||
        EMPTY_BOOKING_SUMMARY
      );

      setTurns([]);
      setElapsedSeconds(0);

      if (
        !remoteAudioRef.current
      ) {
        throw new Error(
          "Remote audio element is unavailable."
        );
      }

      const client =
        new QwenRealtimeClient(
          call.call_id,
          voiceConfig,
          {
            onUserTurn:
              (turn) =>
                void persistTurnWithId(
                  call.call_id,
                  turn
                ),

            onAssistantTurn:
              (turn) =>
                void persistTurnWithId(
                  call.call_id,
                  turn
                ),

            onConnectionState:
              (state) => {
                if (
                  state ===
                  "connected"
                ) {
                  setConnected(true);

                  elapsedStart.current =
                    Date.now();

                  setStatus(
                    "Listening"
                  );
                } else if (
                  state ===
                  "connecting"
                ) {
                  setStatus(
                    "Connecting…"
                  );
                } else if (
                  state ===
                  "disconnected"
                ) {
                  setStatus(
                    "Reconnecting…"
                  );
                }
              },

            onSpeakingChange:
              setAssistantSpeaking,

            onError:
              (message) => {
                setStatus(
                  message
                );

                setAssistantSpeaking(
                  false
                );
              }
          }
        );

      clientRef.current =
        client;

      await client.connect(
        remoteAudioRef.current
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to start."
      );

      await clientRef.current
        ?.close();

      clientRef.current =
        null;

      setConnected(false);

      setAssistantSpeaking(
        false
      );
    } finally {
      setStarting(false);
    }
  }

  async function stopConversation() {
    if (endingRef.current) {
      return;
    }

    endingRef.current = true;

    const id =
      callId;

    try {
      setStatus(
        "Saving…"
      );

      await clientRef.current
        ?.close();

      clientRef.current =
        null;

      if (id) {
        await endCall(id);
      }

      setConnected(false);
      setMuted(false);

      setAssistantSpeaking(
        false
      );

      setStatus(
        "Conversation saved"
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to end call."
      );
    } finally {
      endingRef.current =
        false;
    }
  }

  function toggleMute() {
    const nextMuted =
      !muted;

    clientRef.current
      ?.setMuted(nextMuted);

    setMuted(nextMuted);
  }

  return (
    <div className="voice-page-shell">
      <div className="voice-app">
        <header className="voice-header">
          <button
            className="menu-button"
            onClick={() =>
              setMenuOpen(
                (open) => !open
              )
            }
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <div
            className={
              `connection-badge ${
                connected
                  ? "connected"
                  : ""
              }`
            }
          >
            <span />

            <strong>
              {connected
                ? elapsed
                : "Offline"}
            </strong>
          </div>
        </header>

        {menuOpen && (
          <div className="account-popover">
            <div className="account-details">
              <strong>
                {user.name}
              </strong>

              <span>
                {user.email}
              </span>
            </div>

            <button
              onClick={onLogout}
            >
              <LogOut
                size={16}
              />

              Sign out
            </button>
          </div>
        )}

        <Avatar
          speaking={
            assistantSpeaking
          }
        />

        <section className="content-sheet">
          <div className="assistant-status">
            <div
              className={
                `main-wave ${
                  assistantSpeaking
                    ? "active"
                    : ""
                }`
              }
            >
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div>
              <strong>
                AI Assistant
              </strong>

              <span>
                {status}
              </span>
            </div>
          </div>

          <button
            className="summary-heading"
            type="button"
            onClick={() =>
              setSummaryOpen(
                (open) => !open
              )
            }
          >
            <div>
              <h2>
                Pandit Booking Summary
              </h2>

              <p>
                {completedCount}/6
                booking details confirmed
              </p>
            </div>

            <ChevronDown
              size={20}
              className={
                summaryOpen
                  ? "open"
                  : ""
              }
            />
          </button>

          {summaryOpen && (
            <div className="appointment-summary">
              <AppointmentRow
                icon={
                  <UserRound
                    size={20}
                  />
                }
                label="Name"
                value={summary.name}
              />

              <AppointmentRow
                icon={
                  <Phone
                    size={20}
                  />
                }
                label="Phone"
                value={summary.phone}
              />

              <AppointmentRow
                icon={
                  <Sparkles
                    size={20}
                  />
                }
                label="Ritual / Service"
                value={summary.service}
              />

              <AppointmentRow
                icon={
                  <CalendarClock
                    size={20}
                  />
                }
                label="Schedule"
                value={summary.schedule}
              />

              <AppointmentRow
                icon={
                  <Timer
                    size={20}
                  />
                }
                label="Duration"
                value={summary.duration}
              />

              <AppointmentRow
                icon={
                  <MapPin
                    size={20}
                  />
                }
                label="Address"
                value={summary.address}
              />
            </div>
          )}

          <div className="transcript-heading">
            <span>
              Conversation
            </span>

            {turns.length > 0 && (
              <small>
                {turns.length} turns
              </small>
            )}
          </div>

          <div className="transcript-panel">
            {turns.length === 0 ? (
              <div className="empty-state">
                <Volume2
                  size={20}
                />

                <p>
                  Start the conversation.
                  Details will update here
                  automatically while you
                  speak.
                </p>
              </div>
            ) : (
              turns
                .slice(-6)
                .map((turn) => (
                  <div
                    className={
                      `transcript-turn ${
                        turn.role
                      }`
                    }
                    key={
                      turn.turn_id
                    }
                  >
                    <div className="speaker-orb">
                      {turn.role ===
                      "assistant"
                        ? "✦"
                        : "●"}
                    </div>

                    <div className="transcript-copy">
                      <div className="transcript-meta">
                        <strong>
                          {turn.role ===
                          "assistant"
                            ? "AI Assistant"
                            : "You"}
                        </strong>

                        <span>
                          {new Date(
                            turn.created_at
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit"
                            }
                          )}
                        </span>
                      </div>

                      <p>
                        {turn.transcript}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>

        <div className="control-dock">
          {!connected ? (
            <button
              className="start-button"
              onClick={
                startConversation
              }
              disabled={
                starting
              }
            >
              <Mic
                size={22}
              />

              {starting
                ? "Connecting…"
                : "Start conversation"}
            </button>
          ) : (
            <div className="active-controls">
              <button
                className={
                  `mute-button ${
                    muted
                      ? "muted"
                      : ""
                  }`
                }
                onClick={
                  toggleMute
                }
                aria-label={
                  muted
                    ? "Unmute"
                    : "Mute"
                }
              >
                {muted ? (
                  <MicOff
                    size={22}
                  />
                ) : (
                  <Mic
                    size={22}
                  />
                )}
              </button>

              <button
                className="end-button"
                onClick={
                  stopConversation
                }
              >
                <Power
                  size={21}
                />

                End conversation
              </button>
            </div>
          )}
        </div>

        <audio
          ref={remoteAudioRef}
          playsInline
        />
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] =
    useState<User | null>(
      null
    );

  const [
    checkingSession,
    setCheckingSession
  ] = useState(true);

  useEffect(() => {
    const token =
      getToken();

    if (!token) {
      setCheckingSession(
        false
      );

      return;
    }

    me()
      .then(setUser)
      .catch(() =>
        clearToken()
      )
      .finally(() =>
        setCheckingSession(
          false
        )
      );
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (checkingSession) {
    return (
      <div className="boot-screen">
        Loading secure session…
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onAuthenticated={
          setUser
        }
      />
    );
  }

  return (
    <VoicePage
      user={user}
      onLogout={
        handleLogout
      }
    />
  );
}
