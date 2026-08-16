/**
 * TruGenVideoInterviewer.jsx
 *
 * Real-time avatar interviewer using LiveKit + TruGen.
 *
 * Exposes via ref (same contract as VRMAvatarInterviewer):
 *   ref.current.speak(text)     – TTS via /api/v2/speak → WAV → <audio>, drives LiveKit avatar
 *   ref.current.stopSpeaking()  – interrupt current audio + reset state
 *   ref.current.prefetch()      – no-op (LiveKit streams real-time; kept for API compat)
 *
 * Props:
 *   sessionData   – { interview_id } used to scope the LiveKit room
 *   persona       – AVATAR_PERSONAS entry (used for fallback image/video)
 *   onStateChange(state) – fired on: 'idle' | 'connecting' | 'speaking' | 'error'
 *   className / style   – passed to outer wrapper
 *
 * Fallback tiers (in order):
 *   1. LiveKit + TruGen video track (requires LIVEKIT_* env vars + TruGen agent running)
 *   2. WAV audio via /api/v2/speak with idle-video loop (no lip-sync)
 *   3. window.speechSynthesis (last resort if /api/v2/speak also fails)
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { LiveKitRoom, VideoTrack, useTracks, RoomAudioRenderer } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ServerUrl } from '../App';

const AVATAR_STATE = {
  IDLE:       'idle',
  CONNECTING: 'connecting',
  SPEAKING:   'speaking',
  ERROR:      'error',
};

// ── TruGenVideoInterviewer ────────────────────────────────────────────────────
const TruGenVideoInterviewer = forwardRef(function TruGenVideoInterviewer(
  { sessionData, persona, onStateChange, className, style },
  ref
) {
  const [token,         setToken        ] = useState(null);
  const [liveKitUrl,   setLiveKitUrl   ] = useState(null);
  const [liveKitError, setLiveKitError ] = useState(false);
  const [avatarState,  setAvatarState  ] = useState(AVATAR_STATE.CONNECTING);

  // Holds the currently playing <audio> element so stopSpeaking() can interrupt it
  const audioRef = useRef(null);

  const setState = (next) => {
    setAvatarState(next);
    onStateChange?.(next);
  };

  // ── Fetch LiveKit room token on mount ────────────────────────────────────
  useEffect(() => {
    const roomName = sessionData?.interview_id || 'default_room';
    const avatarId = persona?.trugenAvatarId || '80b9095f';
    const fetchToken = async () => {
      try {
        const res = await fetch(`${ServerUrl}/api/livekit/token/${roomName}?avatar_id=${avatarId}`, {
          credentials: 'include',  // send JWT cookie
        });
        if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
        const data = await res.json();
        setToken(data.token);
        setLiveKitUrl(data.url || null);
        setState(AVATAR_STATE.IDLE);
      } catch (err) {
        console.warn('LiveKit token fetch failed — avatar will use audio-only fallback:', err.message);
        setLiveKitError(true);
        setState(AVATAR_STATE.ERROR);
      }
    };
    fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.interview_id, persona?.trugenAvatarId]);

  // ── Imperative handle ────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    /**
     * speak(text) → Promise<void>
     *
     * 1. Calls POST /api/v2/speak → receives audio/wav blob
     * 2. Plays it via a new Audio element
     * 3. Resolves the promise when audio ends (or on error, falling back gracefully)
     *
     * The LiveKit + TruGen agent running in the same room independently subscribes
     * to audio published in the room. When TruGen's agent is configured and running,
     * it lip-syncs the video track to whatever audio is playing in the room.
     *
     * If /api/v2/speak fails entirely, falls back to window.speechSynthesis.
     */
    async speak(text) {
      // Stop any currently playing audio before starting new speech
      _stopCurrentAudio();
      setState(AVATAR_STATE.SPEAKING);

      try {
        const res = await fetch(`${ServerUrl}/api/v2/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error(`/api/v2/speak returned ${res.status}`);

        const blob = await res.blob();         // audio/wav
        const url  = URL.createObjectURL(blob);

        await _playAudioBlob(url);             // resolves on 'ended' or error

        URL.revokeObjectURL(url);
        setState(AVATAR_STATE.IDLE);
      } catch (err) {
        console.warn('TTS fetch failed — using browser speech synthesis fallback:', err.message);
        // Fallback: browser TTS (last resort)
        await _browserTTSFallback(text);
        setState(AVATAR_STATE.IDLE);
      }
    },

    stopSpeaking() {
      _stopCurrentAudio();
      window.speechSynthesis?.cancel();
      setState(AVATAR_STATE.IDLE);
    },

    /** No-op — kept for API compatibility with VRMAvatarInterviewer */
    prefetch() {},
  }));

  // ── Audio helpers ─────────────────────────────────────────────────────────

  function _stopCurrentAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }

  /**
   * Play a blob URL through an <Audio> element.
   * Returns a Promise that resolves when audio ends, or rejects on error.
   */
  function _playAudioBlob(blobUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.onended  = () => { audioRef.current = null; resolve(); };
      audio.onerror  = (e) => { audioRef.current = null; reject(e); };
      audio.play().catch(reject);
    });
  }

  /**
   * Last-resort fallback: browser Web Speech API.
   * Returns a Promise that resolves when speech ends.
   */
  function _browserTTSFallback(text) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const u  = new SpeechSynthesisUtterance(text);
      u.lang   = 'en-US';
      u.rate   = 0.9;
      u.onend  = resolve;
      u.onerror = resolve;
      const go = () => {
        const voices = window.speechSynthesis.getVoices();
        const voice  = voices.find(v => v.name === 'Google US English')
                    || voices.find(v => v.name === 'Samantha')
                    || voices.find(v => v.lang === 'en-US')
                    || null;
        if (voice) u.voice = voice;
        window.speechSynthesis.speak(u);
      };
      window.speechSynthesis.getVoices().length > 0
        ? go()
        : (window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.onvoiceschanged = null;
            go();
          });
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fallbackImageSrc = persona?.avatarUrl || persona?.avatarFallback || 'https://assets.trugen.ai/images/avatarImages/matt.jpeg';
  const fallbackVideoSrc = persona?.idleVideoUrl || 'https://assets.trugen.ai/videos/avatar-videos/matt_wide.mp4';

  // Fallback UI: no LiveKit token (credentials not configured or network error)
  if (liveKitError || !token) {
    return (
      <div
        id="trugen-avatar-fallback"
        className={`trugen-avatar-container ${className || ''}`}
        style={{ position: 'relative', background: '#0a0f1c', ...style }}
      >
        <img
          src={fallbackImageSrc}
          alt={`${persona?.name || 'AI Interviewer'} avatar`}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            e.target.src = persona?.avatarFallback || 'https://ui-avatars.com/api/?name=Alex+Vance&background=064e3b&color=10b981&size=400';
          }}
        />
        {/* Idle video loop */}
        <video
          src={fallbackVideoSrc}
          autoPlay loop muted playsInline
          style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {/* Speaking indicator overlay when audio is playing in fallback mode */}
        {avatarState === AVATAR_STATE.SPEAKING && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)',
            borderRadius: 20, padding: '4px 14px',
            color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            backdropFilter: 'blur(6px)', zIndex: 10,
          }}>
            ● Speaking
          </div>
        )}

        {/* Status badge — only show when LiveKit is offline so user knows why */}
        {liveKitError && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(239,68,68,0.85)', color: '#fff',
            fontSize: 10, padding: '3px 8px', borderRadius: 6,
            backdropFilter: 'blur(4px)', zIndex: 10,
          }}>
            LiveKit Offline — Audio Fallback Active
          </div>
        )}
      </div>
    );
  }

  // Primary: LiveKit room with TruGen video track
  const wsUrl = liveKitUrl || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEKIT_URL) || 'wss://ai-based-interview-system-wms62ikb.livekit.cloud';

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
      video={false}   // candidate camera off — this component shows the AVATAR, not the candidate
      audio={false}   // mic is handled separately by V2InterviewRoom's startMic()
      id="trugen-livekit-room"
      className={`trugen-avatar-container ${className || ''}`}
      style={{ position: 'relative', background: '#0a0f1c', ...style }}
      onError={(err) => {
        console.warn('LiveKit room error — degrading to audio-only:', err);
        setLiveKitError(true);
        setState(AVATAR_STATE.ERROR);
      }}
    >
      <RoomAudioRenderer />
      <TruGenVideoTrack
        fallbackImageSrc={fallbackImageSrc}
        fallbackVideoSrc={fallbackVideoSrc}
        avatarState={avatarState}
        personaName={persona?.name}
      />
    </LiveKitRoom>
  );
});

// ── Inner component: renders the TruGen agent's video track ──────────────────
function TruGenVideoTrack({ fallbackImageSrc, fallbackVideoSrc, avatarState, personaName }) {
  // Subscribe to Camera tracks from all participants (TruGen agent publishes camera)
  const tracks = useTracks([Track.Source.Camera]);

  // Find the track belonging to the TruGen avatar participant
  const avatarTrack = tracks.find(
    (t) => t.participant.identity.includes('agent') || 
           t.participant.identity.includes('trugen') ||
           !t.participant.identity.startsWith('candidate')
  );

  if (!avatarTrack) {
    // Agent hasn't joined or is initializing — show idle video / image
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img
          src={fallbackImageSrc}
          alt={`${personaName || 'AI Interviewer'} avatar`}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
          }}
          onError={(e) => {
            e.target.src = 'https://assets.trugen.ai/images/avatarImages/matt.jpeg';
          }}
        />
        <video
          src={fallbackVideoSrc}
          autoPlay loop muted playsInline
          style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {avatarState === AVATAR_STATE.SPEAKING && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)',
            borderRadius: 20, padding: '4px 14px',
            color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            backdropFilter: 'blur(6px)', zIndex: 10,
          }}>
            ● Speaking
          </div>
        )}
      </div>
    );
  }

  // Agent is live — render real-time lip-synced video track
  return (
    <VideoTrack
      trackRef={avatarTrack}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

export default TruGenVideoInterviewer;

