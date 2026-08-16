/**
 * VRMAvatarInterviewer.jsx
 *
 * A 3D VRM avatar driven by Rhubarb lip-sync visemes for turn-based
 * interview sessions.
 *
 * Exposes via ref:
 *   avatarRef.current.speak(text)      – synthesise + lip-sync question
 *   avatarRef.current.prefetch(text)   – background-fetch for next question
 *   avatarRef.current.stopSpeaking()   – interrupt current speech
 *
 * Props:
 *   onStateChange(state)   – fired on each state transition
 *   onError(error)         – fired if VRM fails to load
 *   persona                – one of AVATAR_PERSONAS (for fallback image)
 *   caption                – if true, shows caption overlay (accessibility)
 *   style / className      – passed to outer wrapper div
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { ServerUrl } from '../App'

// ── Constants ────────────────────────────────────────────────────────────────
const VRM_MODEL_URL = '/avatar.vrm'

/**
 * Rhubarb phoneme shape → VRM / @pixiv/three-vrm expression name.
 * Extended set: A-H + X (silence).
 */
const VISEME_MAP = {
  A: 'aa',      // "bad"  - wide open
  B: 'oh',      // "boom" - rounded bilabial
  C: 'ih',      // "bit"  - mid unrounded
  D: 'ou',      // "boot" - rounded forward
  E: 'ih',      // "bee"  - tense
  F: 'ff',      // f / v  - labiodental
  G: 'oh',      // k / g  - velar
  H: 'aa',      // h      - laryngeal open
  X: 'neutral', // silence / rest
}

// All blendshape names used — must be reset between cues
const ALL_SHAPES = [...new Set(Object.values(VISEME_MAP))]

// Avatar states
export const AVATAR_STATE = {
  IDLE:       'idle',
  LOADING:    'loading',
  THINKING:   'thinking',
  SPEAKING:   'speaking',
  LISTENING:  'listening',
  ERROR:      'error',
}

// Prefetch cache: normalized question text → payload {audio, visemes, duration}
const prefetchCache = new Map()

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeText(text) {
  return (text || '').trim().toLowerCase()
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// ── Component ─────────────────────────────────────────────────────────────────
const VRMAvatarInterviewer = forwardRef(function VRMAvatarInterviewer(props, ref) {
  const {
    onStateChange,
    onError,
    persona = null,
    showCaption = true,
    style = {},
    className = '',
  } = props

  const mountRef   = useRef(null)   // <canvas> mount point
  const rendererRef = useRef(null)
  const sceneRef   = useRef(null)
  const cameraRef  = useRef(null)
  const vrmRef     = useRef(null)
  const clockRef   = useRef(new THREE.Clock())
  const rafRef     = useRef(null)

  const audioRef        = useRef(null)   // current HTMLAudioElement
  const visemesRef      = useRef([])     // current viseme cue list
  const audioStartRef   = useRef(0)      // performance.now() when audio started

  const [avatarState, setAvatarState] = useState(AVATAR_STATE.LOADING)
  const [vrmLoaded, setVrmLoaded]     = useState(false)
  const [captionText, setCaptionText] = useState('')
  const [loadError, setLoadError]     = useState(null)

  // ── State helper ────────────────────────────────────────────────────────────
  const setState = useCallback((next) => {
    setAvatarState(next)
    onStateChange?.(next)
  }, [onStateChange])

  // ── THREE.js scene setup ────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // WebGL capability check
    let canvas
    try {
      canvas = document.createElement('canvas')
      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!ctx) throw new Error('No WebGL context')
    } catch {
      setLoadError('WebGL not supported')
      setState(AVATAR_STATE.ERROR)
      onError?.('WebGL not supported')
      return
    }

    const W = el.clientWidth  || 400
    const H = el.clientHeight || 520

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xfff8f0, 1.4)
    dirLight.position.set(2, 4, 3)
    scene.add(dirLight)
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.5)
    fillLight.position.set(-2, 2, -2)
    scene.add(fillLight)

    // Camera — framed for portrait/avatar bust
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 20)
    camera.position.set(0, 1.35, 2.2)
    camera.lookAt(0, 1.3, 0)
    cameraRef.current = camera

    // Load VRM
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    loader.load(
      VRM_MODEL_URL,
      (gltf) => {
        const vrm = gltf.userData.vrm
        if (!vrm) {
          setLoadError('VRM data not found in GLTF')
          setState(AVATAR_STATE.ERROR)
          onError?.('VRM parse failed')
          return
        }
        VRMUtils.rotateVRM0(vrm)
        scene.add(vrm.scene)
        vrmRef.current = vrm
        setVrmLoaded(true)
        setState(AVATAR_STATE.IDLE)
      },
      undefined,
      (err) => {
        console.error('VRM load error:', err)
        setLoadError(String(err.message || err))
        setState(AVATAR_STATE.ERROR)
        onError?.(err)
      },
    )

    // Render loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const delta = clockRef.current.getDelta()
      if (vrmRef.current) {
        _applyIdleMotion(vrmRef.current, clockRef.current.elapsedTime)
        _applyVisemeFrame(vrmRef.current)
        vrmRef.current.update(delta)
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const onResize = () => {
      if (!el) return
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      renderer.dispose()
      if (el && renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Idle micro-motion ───────────────────────────────────────────────────────
  const _blinkPhaseRef    = useRef(0)
  const _lastBlinkRef     = useRef(0)
  const _blinkDurationRef = useRef(0)

  function _applyIdleMotion(vrm, t) {
    if (!vrm.expressionManager) return
    // Only apply blink + sway when NOT speaking (viseme loop handles speaking)
    if (avatarStateRef.current === AVATAR_STATE.SPEAKING) return

    // Slow head sway
    const head = vrm.humanoid?.getNormalizedBoneNode?.('head')
    if (head) {
      head.rotation.y = Math.sin(t * 0.4) * 0.06
      head.rotation.x = Math.sin(t * 0.3) * 0.025 - 0.04
    }

    // Blink
    const now = performance.now()
    if (!_lastBlinkRef.current) _lastBlinkRef.current = now
    if (now - _lastBlinkRef.current > _blinkDurationRef.current) {
      _lastBlinkRef.current = now
      _blinkDurationRef.current = 2500 + Math.random() * 2500
      _blinkPhaseRef.current    = now
    }
    const blinkElapsed = now - _blinkPhaseRef.current
    const blinkValue   = blinkElapsed < 80
      ? smoothstep(0, 80, blinkElapsed)
      : blinkElapsed < 160
        ? smoothstep(160, 80, blinkElapsed)
        : 0
    vrm.expressionManager.setValue('blink', blinkValue)
  }

  // ── Viseme frame ────────────────────────────────────────────────────────────
  function _applyVisemeFrame(vrm) {
    if (!vrm.expressionManager) return
    const visemes = visemesRef.current
    if (!visemes.length || !audioStartRef.current) return

    const audioElapsed = (performance.now() - audioStartRef.current) / 1000

    // Find current active cue
    let activeCue = null
    for (const cue of visemes) {
      if (audioElapsed >= cue.start && audioElapsed < cue.end) {
        activeCue = cue
        break
      }
    }

    // Reset all shapes first
    ALL_SHAPES.forEach((shape) => {
      try { vrm.expressionManager.setValue(shape, 0) } catch {}
    })

    if (activeCue) {
      const shape    = activeCue.vrm_shape
      const progress = (audioElapsed - activeCue.start) / Math.max(0.001, activeCue.end - activeCue.start)
      // Ease-in first 20%, ease-out last 20%, full weight in middle
      let weight
      if (progress < 0.2)      weight = smoothstep(0, 0.2, progress)
      else if (progress > 0.8) weight = smoothstep(1, 0.8, progress)
      else                     weight = 1.0

      try { vrm.expressionManager.setValue(shape, Math.min(weight, 1.0)) } catch {}
    }
  }

  // Keep avatarState in a ref so the RAF loop can read it without stale closure
  const avatarStateRef = useRef(AVATAR_STATE.LOADING)
  useEffect(() => { avatarStateRef.current = avatarState }, [avatarState])

  // ── API fetch helper ─────────────────────────────────────────────────────────
  const fetchSpeak = useCallback(async (text) => {
    const key = normalizeText(text)
    if (prefetchCache.has(key)) return prefetchCache.get(key)

    const res = await fetch(`${ServerUrl}/api/avatar/speak`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`Avatar API ${res.status}`)
    return res.json()
  }, [])

  // ── Public API ───────────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    /** Speak a question aloud with lip sync */
    async speak(text) {
      if (!text?.trim()) return
      setState(AVATAR_STATE.THINKING)
      setCaptionText(text)

      // Stop any in-progress audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      visemesRef.current  = []
      audioStartRef.current = 0

      let payload
      try {
        setState(AVATAR_STATE.THINKING)
        payload = await fetchSpeak(text)
      } catch (err) {
        console.error('Avatar speak fetch failed:', err)
        // Fallback: browser TTS
        _browserTTSFallback(text, () => setState(AVATAR_STATE.IDLE))
        setState(AVATAR_STATE.SPEAKING)
        return
      }

      const { audio, visemes = [], error } = payload

      if (error && !audio) {
        // Full failure → browser TTS fallback
        _browserTTSFallback(text, () => setState(AVATAR_STATE.IDLE))
        setState(AVATAR_STATE.SPEAKING)
        return
      }

      // Store visemes
      visemesRef.current = visemes

      // Decode audio
      if (audio) {
        const blob = _b64ToBlob(audio, 'audio/wav')
        const url  = URL.createObjectURL(blob)
        const el   = new Audio(url)
        audioRef.current = el

        el.addEventListener('play', () => {
          audioStartRef.current = performance.now()
          setState(AVATAR_STATE.SPEAKING)
        })
        el.addEventListener('ended', () => {
          URL.revokeObjectURL(url)
          visemesRef.current  = []
          audioStartRef.current = 0
          setState(AVATAR_STATE.IDLE)
        })
        el.addEventListener('error', () => {
          URL.revokeObjectURL(url)
          setState(AVATAR_STATE.IDLE)
        })
        el.play().catch(() => {
          // Autoplay blocked — degrade to text-only with caption
          setState(AVATAR_STATE.IDLE)
        })
      } else {
        setState(AVATAR_STATE.IDLE)
      }
    },

    /** Pre-fetch next question in background */
    prefetch(text) {
      if (!text?.trim()) return
      const key = normalizeText(text)
      if (prefetchCache.has(key)) return
      fetchSpeak(text)
        .then((payload) => {
          if (payload?.audio) prefetchCache.set(key, payload)
        })
        .catch(() => {/* silent — prefetch failures are non-critical */})
    },

    /** Interrupt current speech */
    stopSpeaking() {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      visemesRef.current  = []
      audioStartRef.current = 0
      setState(AVATAR_STATE.IDLE)
    },

    /** Transition to listening state */
    setListening(isListening) {
      setState(isListening ? AVATAR_STATE.LISTENING : AVATAR_STATE.IDLE)
    },
  }), [fetchSpeak, setState])

  // ── Browser TTS fallback ────────────────────────────────────────────────────
  function _browserTTSFallback(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.82; u.pitch = 1
    u.onend  = () => onEnd?.()
    u.onerror = () => onEnd?.()
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find(v => v.name === 'Google US English')
           || voices.find(v => v.lang === 'en-US') || null
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  }

  // ── b64 → Blob helper ────────────────────────────────────────────────────────
  function _b64ToBlob(b64, mimeType) {
    const bytes  = atob(b64)
    const buffer = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i)
    return new Blob([buffer], { type: mimeType })
  }

  // ── State label & colour ─────────────────────────────────────────────────────
  const stateInfo = {
    [AVATAR_STATE.LOADING]:   { label: 'Loading…',   color: '#64748b', icon: '⟳' },
    [AVATAR_STATE.IDLE]:      { label: 'Ready',       color: '#10b981', icon: '●' },
    [AVATAR_STATE.THINKING]:  { label: 'Thinking…',  color: '#f59e0b', icon: '⟳' },
    [AVATAR_STATE.SPEAKING]:  { label: 'Speaking',   color: '#6366f1', icon: '♪' },
    [AVATAR_STATE.LISTENING]: { label: 'Listening',  color: '#06b6d4', icon: '◉' },
    [AVATAR_STATE.ERROR]:     { label: 'Offline',    color: '#ef4444', icon: '!' },
  }[avatarState] ?? { label: avatarState, color: '#64748b', icon: '?' }

  const isError = avatarState === AVATAR_STATE.ERROR

  return (
    <div
      className={`vrm-avatar-interviewer ${className}`}
      style={{ position: 'relative', ...style }}
    >
      {/* ── 3D canvas mount ─────────────────────────────── */}
      {!isError && (
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
        />
      )}

      {/* ── Static fallback (WebGL error or load failure) ─ */}
      {isError && persona && (
        <div style={styles.fallback}>
          <img
            src={persona.avatarUrl || persona.avatarFallback}
            alt={persona.name}
            style={styles.fallbackImg}
            onError={(e) => { e.target.src = persona.avatarFallback }}
          />
          <p style={styles.fallbackLabel}>{persona.name}</p>
          <p style={{ ...styles.fallbackLabel, fontSize: 11, opacity: 0.6 }}>
            3D avatar unavailable — audio mode active
          </p>
        </div>
      )}

      {/* ── Loading overlay ─────────────────────────────── */}
      {avatarState === AVATAR_STATE.LOADING && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>
            Loading avatar…
          </p>
        </div>
      )}

      {/* ── Status badge ────────────────────────────────── */}
      <div style={{ ...styles.statusBadge, borderColor: stateInfo.color }}>
        <span style={{ color: stateInfo.color, fontSize: 11, marginRight: 4 }}>
          {stateInfo.icon}
        </span>
        <span style={{ color: stateInfo.color, fontSize: 11, fontWeight: 600 }}>
          {stateInfo.label}
        </span>
      </div>

      {/* ── Pulsing ring when speaking ───────────────────── */}
      {avatarState === AVATAR_STATE.SPEAKING && (
        <div style={styles.speakingRing} />
      )}

      {/* ── Caption overlay ──────────────────────────────── */}
      {showCaption && captionText && avatarState === AVATAR_STATE.SPEAKING && (
        <div style={styles.caption} aria-live="polite" role="status">
          {captionText}
        </div>
      )}
    </div>
  )
})

export default VRMAvatarInterviewer

// ── Inline styles ─────────────────────────────────────────────────────────────
const styles = {
  fallback: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)',
    borderRadius: 16,
  },
  fallbackImg: {
    width: 160, height: 160,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #334155',
    boxShadow: '0 0 30px rgba(99,102,241,0.3)',
  },
  fallbackLabel: {
    color: '#e2e8f0', fontSize: 14, marginTop: 10, fontWeight: 600,
  },
  loadingOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(15,23,42,0.85)',
    borderRadius: 'inherit',
    zIndex: 10,
  },
  spinner: {
    width: 36, height: 36,
    border: '3px solid #334155',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  statusBadge: {
    position: 'absolute', top: 10, right: 10,
    display: 'flex', alignItems: 'center',
    background: 'rgba(15,23,42,0.75)',
    backdropFilter: 'blur(8px)',
    border: '1px solid',
    borderRadius: 20,
    padding: '3px 10px',
    zIndex: 20,
  },
  speakingRing: {
    position: 'absolute', inset: -4,
    borderRadius: 'inherit',
    border: '2px solid rgba(99,102,241,0.5)',
    animation: 'pulse-ring 1.4s ease-in-out infinite',
    pointerEvents: 'none',
    zIndex: 5,
  },
  caption: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.72)',
    backdropFilter: 'blur(6px)',
    color: '#f1f5f9',
    fontSize: 13,
    lineHeight: 1.5,
    padding: '10px 14px',
    borderRadius: '0 0 16px 16px',
    fontWeight: 500,
    letterSpacing: 0.1,
    zIndex: 15,
  },
}
