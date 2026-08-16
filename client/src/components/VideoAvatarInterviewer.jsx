import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect
} from 'react';
import { ServerUrl } from '../App';

export const AVATAR_STATE = {
  IDLE:       'idle',
  LOADING:    'loading',
  THINKING:   'thinking',
  SPEAKING:   'speaking',
  LISTENING:  'listening',
  ERROR:      'error',
};

const prefetchCache = new Map();

function normalizeText(text) {
  return (text || '').trim().toLowerCase();
}

const VideoAvatarInterviewer = forwardRef(function VideoAvatarInterviewer(props, ref) {
  const {
    onStateChange,
    onError,
    persona = null,
    showCaption = true,
    style = {},
    className = '',
  } = props;

  const [avatarState, setAvatarState] = useState(AVATAR_STATE.IDLE);
  const [captionText, setCaptionText] = useState('');
  const [loadError, setLoadError] = useState(null);

  // The URL for the speaking video returned from Wav2Lip
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  
  const idleVideoRef = useRef(null);
  const speakingVideoRef = useRef(null);
  const audioFallbackRef = useRef(null);

  const setState = useCallback((next) => {
    setAvatarState(next);
    onStateChange?.(next);
  }, [onStateChange]);

  const fetchSpeak = useCallback(async (text) => {
    const key = normalizeText(text);
    if (prefetchCache.has(key)) return prefetchCache.get(key);

    const res = await fetch(`${ServerUrl}/api/avatar/speak`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`Avatar API ${res.status}`);
    return res.json();
  }, []);

  const stopCurrentMedia = () => {
    if (speakingVideoRef.current) {
      speakingVideoRef.current.pause();
      speakingVideoRef.current.currentTime = 0;
    }
    if (audioFallbackRef.current) {
      audioFallbackRef.current.pause();
      audioFallbackRef.current.src = '';
    }
    setActiveVideoUrl(null);
  };

  useImperativeHandle(ref, () => ({
    async speak(text) {
      if (!text?.trim()) return;
      
      stopCurrentMedia();
      setState(AVATAR_STATE.THINKING);
      setCaptionText(text);

      try {
        const payload = await fetchSpeak(text);
        const { videoUrl, audio, error } = payload;

        if (videoUrl) {
          // Play the generated Wav2Lip video
          setActiveVideoUrl(`${ServerUrl}${videoUrl}`);
          setState(AVATAR_STATE.SPEAKING);
        } else if (audio) {
          // Fallback to pure audio if ML service is down
          console.warn("Wav2Lip video failed, falling back to pure audio:", error);
          const blob = _b64ToBlob(audio, 'audio/wav');
          const url = URL.createObjectURL(blob);
          const el = new Audio(url);
          audioFallbackRef.current = el;
          
          el.addEventListener('play', () => setState(AVATAR_STATE.SPEAKING));
          el.addEventListener('ended', () => {
            URL.revokeObjectURL(url);
            setState(AVATAR_STATE.IDLE);
          });
          el.addEventListener('error', () => {
            URL.revokeObjectURL(url);
            setState(AVATAR_STATE.IDLE);
          });
          el.play().catch(() => setState(AVATAR_STATE.IDLE));
        } else {
          // Total failure
          _browserTTSFallback(text, () => setState(AVATAR_STATE.IDLE));
          setState(AVATAR_STATE.SPEAKING);
        }
      } catch (err) {
        console.error('Avatar API fetch failed:', err);
        _browserTTSFallback(text, () => setState(AVATAR_STATE.IDLE));
        setState(AVATAR_STATE.SPEAKING);
      }
    },

    prefetch(text) {
      if (!text?.trim()) return;
      const key = normalizeText(text);
      if (prefetchCache.has(key)) return;
      fetchSpeak(text).then((payload) => {
        if (payload?.videoUrl || payload?.audio) {
          prefetchCache.set(key, payload);
        }
      }).catch(() => {});
    },

    stopSpeaking() {
      stopCurrentMedia();
      setState(AVATAR_STATE.IDLE);
    },

    setListening(isListening) {
      setState(isListening ? AVATAR_STATE.LISTENING : AVATAR_STATE.IDLE);
    }
  }), [fetchSpeak, setState]);

  // Ensure speaking video plays automatically when URL is set
  useEffect(() => {
    if (activeVideoUrl && speakingVideoRef.current) {
      speakingVideoRef.current.load();
      speakingVideoRef.current.play().catch((e) => {
        console.error("Autoplay prevented for speaking video", e);
        setState(AVATAR_STATE.IDLE);
      });
    }
  }, [activeVideoUrl, setState]);

  // ── Browser TTS fallback ──
  function _browserTTSFallback(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.82; u.pitch = 1;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  }

  function _b64ToBlob(b64, mimeType) {
    const bytes = atob(b64);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
    return new Blob([buffer], { type: mimeType });
  }

  const isSpeakingVideoActive = avatarState === AVATAR_STATE.SPEAKING && activeVideoUrl;
  const isError = avatarState === AVATAR_STATE.ERROR;

  // We use a dummy idle video URL or fallback image if idle video not provided
  const idleVideoSrc = persona?.idleVideoUrl || '/idle.mp4'; 
  const fallbackImageSrc = persona?.avatarUrl || persona?.avatarFallback || '/agent.png';

  const stateInfo = {
    [AVATAR_STATE.IDLE]:      { label: 'Ready',       color: '#10b981', icon: '●' },
    [AVATAR_STATE.THINKING]:  { label: 'Thinking…',  color: '#f59e0b', icon: '⟳' },
    [AVATAR_STATE.SPEAKING]:  { label: 'Speaking',   color: '#6366f1', icon: '♪' },
    [AVATAR_STATE.LISTENING]: { label: 'Listening',  color: '#06b6d4', icon: '◉' },
    [AVATAR_STATE.ERROR]:     { label: 'Offline',    color: '#ef4444', icon: '!' },
  }[avatarState] ?? { label: avatarState, color: '#64748b', icon: '?' };

  return (
    <div className={`video-avatar-interviewer ${className}`} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 16, background: '#000', ...style }}>
      
      {/* ── Idle Video Layer ── */}
      <video
        ref={idleVideoRef}
        src={idleVideoSrc}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: isSpeakingVideoActive ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        onError={(e) => {
          // If idle video doesn't exist, we just show the fallback image below it
          e.target.style.display = 'none';
        }}
      />

      {/* ── Static Image Fallback (underneath videos in case they fail) ── */}
      <img
        src={fallbackImageSrc}
        alt="Avatar Fallback"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          zIndex: -1 // sits behind the videos
        }}
        onError={(e) => { e.target.src = '/agent.png'; }}
      />

      {/* ── Speaking Video Layer ── */}
      {activeVideoUrl && (
        <video
          ref={speakingVideoRef}
          src={activeVideoUrl}
          playsInline
          onEnded={() => {
            setActiveVideoUrl(null);
            setState(AVATAR_STATE.IDLE);
          }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: isSpeakingVideoActive ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}

      {/* ── Status Badge ── */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(8px)', border: `1px solid ${stateInfo.color}`, borderRadius: 20, padding: '3px 10px', zIndex: 20 }}>
        <span style={{ color: stateInfo.color, fontSize: 11, marginRight: 4 }}>{stateInfo.icon}</span>
        <span style={{ color: stateInfo.color, fontSize: 11, fontWeight: 600 }}>{stateInfo.label}</span>
      </div>

      {/* ── Caption Overlay ── */}
      {showCaption && captionText && avatarState === AVATAR_STATE.SPEAKING && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', color: '#f1f5f9', fontSize: 13, padding: '10px 14px', fontWeight: 500, zIndex: 15 }}>
          {captionText}
        </div>
      )}
    </div>
  );
});

export default VideoAvatarInterviewer;
