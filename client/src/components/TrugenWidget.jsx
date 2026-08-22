import React, { Component, useState } from 'react';
import '@aiteammate/agent-widget/styles.css';
import { TrugenAgentWidget } from '@aiteammate/agent-widget';
import HumanAvatar from './HumanAvatar';
import { FaUserCircle, FaRobot, FaSyncAlt } from 'react-icons/fa';

/**
 * Error boundary to gracefully catch LiveKit WebRTC / WritableStream errors
 */
class TrugenErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('TrugenWidget LiveKit notice — switching to neural avatar fallback:', error?.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * TrugenWidget — Official AI Teammate / TruGen Avatar with Lifelike Neural Fallback
 */
export default function TrugenWidget({
  agentId = 'db56efae-05b0-4c3b-956c-914bc31e4c04',
  inline = true,
  onEndCall,
  avatarRef,
  isSpeaking = false,
  isListening = false,
  isThinking = false,
}) {
  const [avatarMode, setAvatarMode] = useState('trugen'); // 'trugen' | 'neural'
  const [connectionFailed, setConnectionFailed] = useState(false);

  const neuralFallback = (
    <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center relative">
      <HumanAvatar
        ref={avatarRef}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isThinking={isThinking}
      />
      {connectionFailed && (
        <div className="absolute bottom-3 left-3 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] text-slate-300 backdrop-blur-md flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Neural Avatar Active (Audio & Vision Connected)
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full min-h-[460px] flex flex-col relative overflow-hidden rounded-3xl bg-[#070b14] border border-white/10 shadow-2xl">
      {/* Mode Switcher Pill */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-950/80 border border-white/10 p-1 rounded-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => { setAvatarMode('trugen'); setConnectionFailed(false); }}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
            avatarMode === 'trugen' && !connectionFailed
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FaRobot size={10} /> 3D Live Agent
        </button>
        <button
          type="button"
          onClick={() => setAvatarMode('neural')}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
            avatarMode === 'neural' || connectionFailed
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FaUserCircle size={10} /> Neural Interviewer
        </button>
      </div>

      {avatarMode === 'neural' || connectionFailed ? (
        neuralFallback
      ) : (
        <TrugenErrorBoundary fallback={neuralFallback}>
          <div className="w-full h-full min-h-[460px] flex items-center justify-center relative">
            <TrugenAgentWidget
              agentId={agentId}
              inline={inline}
              onEndCall={() => {
                onEndCall?.();
                setConnectionFailed(true);
              }}
            />
          </div>
        </TrugenErrorBoundary>
      )}
    </div>
  );
}
