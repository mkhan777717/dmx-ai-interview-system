import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaDesktop,
  FaVideo,
  FaVideoSlash,
  FaSignOutAlt,
  FaCommentDots
} from 'react-icons/fa';
import V2Layout from '../components/V2Layout';
import VideoAvatarInterviewer from '../components/VideoAvatarInterviewer';
import useContinuousSTT from '../hooks/useContinuousSTT';

// A mock unique ID for the meeting session
const SESSION_ID = 'meeting_' + Math.random().toString(36).substring(2, 9);

export default function MeetingRoom() {
  const navigate = useNavigate();

  // State
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversation, setConversation] = useState([]); // [{speaker, text, id, timestamp}]
  
  const [wsConnected, setWsConnected] = useState(false);
  
  // Refs
  const wsRef = useRef(null);
  const avatarRef = useRef(null);
  const screenVideoRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ── WebSocket Connection ──────────────────────────────────────────────────
  useEffect(() => {
    // Determine WS protocol based on current location
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // We assume backend is on port 8000 on localhost, or relative path if deployed
    const wsUrl = `${wsProtocol}//localhost:8000/api/meeting/ws/${SESSION_ID}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'response') {
          // Add AI response to local conversation log
          setConversation(prev => [...prev, {
            id: Date.now().toString(),
            speaker: 'ai',
            text: msg.text,
            timestamp: Date.now()
          }]);
          
          // Make avatar speak
          if (msg.speak && avatarRef.current) {
            avatarRef.current.speak(msg.text);
          }
        }
      } catch (err) {
        console.error('WS Error parsing message:', err);
      }
    };

    ws.onclose = () => setWsConnected(false);

    // Ping interval
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, []);

  // Auto-scroll conversation log
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, liveTranscript]);

  // ── STT Hook ──────────────────────────────────────────────────────────────
  const handleUtterance = useCallback((text) => {
    if (!text.trim()) return;
    
    // Add to local UI
    setConversation(prev => [...prev, {
      id: Date.now().toString(),
      speaker: 'candidate',
      text,
      timestamp: Date.now()
    }]);

    // Send to WS for context buffering and direct address check
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'query', // the backend detects if addressed or just stores as context
        text
      }));
    }
  }, []);

  const { startRecording, stopRecording } = useContinuousSTT({
    recording: micEnabled,
    onTranscript: (text) => setLiveTranscript(text),
    onUtterance: handleUtterance,
    silenceThresholdMs: 1500
  });

  // ── Media Streams ─────────────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (screenEnabled) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      setScreenEnabled(false);
      screenVideoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        screenVideoRef.current.srcObject = stream;
        
        // Listen for user stopping share natively
        stream.getVideoTracks()[0].onended = () => {
          setScreenEnabled(false);
          screenVideoRef.current.srcObject = null;
        };
        
        setScreenEnabled(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    }
  };

  const toggleWebcam = async () => {
    if (webcamEnabled) {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
      }
      setWebcamEnabled(false);
      webcamVideoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamStreamRef.current = stream;
        webcamVideoRef.current.srcObject = stream;
        setWebcamEnabled(true);
      } catch (err) {
        console.error('Webcam error:', err);
      }
    }
  };

  // Keyboard shortcut Ctrl+Space for manual trigger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        
        // Capture frames if enabled
        let screenData = null;
        if (screenEnabled && screenVideoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = screenVideoRef.current.videoWidth;
          canvas.height = screenVideoRef.current.videoHeight;
          canvas.getContext('2d').drawImage(screenVideoRef.current, 0, 0);
          screenData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        }

        let webcamData = null;
        if (webcamEnabled && webcamVideoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = webcamVideoRef.current.videoWidth;
          canvas.height = webcamVideoRef.current.videoHeight;
          canvas.getContext('2d').drawImage(webcamVideoRef.current, 0, 0);
          webcamData = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // If we have screen/webcam data, send specific vision query
          if (screenData) {
            wsRef.current.send(JSON.stringify({
              type: 'screenshot',
              data: screenData,
              question: "Analyze my screen and provide relevant context or help based on our recent conversation."
            }));
          } else if (webcamData) {
            wsRef.current.send(JSON.stringify({
              type: 'webcam',
              data: webcamData,
              question: "Analyze this frame of me and provide relevant context based on our conversation."
            }));
          } else {
            wsRef.current.send(JSON.stringify({
              type: 'query',
              text: "Could you chime in here based on what we've been discussing?",
              force: true
            }));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenEnabled, webcamEnabled]);


  return (
    <V2Layout title="AI Meeting Co-pilot" subtitle="Your real-time meeting assistant">
      <div className="flex flex-col h-[calc(100vh-140px)] gap-4 pb-4">
        
        {/* Connection Status & Helper */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {wsConnected ? 'Connected to AI Co-pilot' : 'Disconnected'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Tip: Say <strong className="text-gray-700">"Hey Alex"</strong> or press <strong className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border">Ctrl + Space</strong> to force response
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left Column: Avatar & Media Previews */}
          <div className="w-1/3 flex flex-col gap-4">
            {/* Avatar Container */}
            <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden relative">
              <VideoAvatarInterviewer 
                ref={avatarRef}
                persona={{
                  name: 'Alex',
                  avatarUrl: '/agent.png',
                  idleVideoUrl: '/idle.mp4'
                }}
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold shadow text-gray-800">
                Alex (AI)
              </div>
            </div>

            {/* Media Previews */}
            {(screenEnabled || webcamEnabled) && (
              <div className="h-48 flex gap-2">
                {screenEnabled && (
                  <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative">
                    <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
                    <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-1.5 rounded flex items-center gap-1">
                      <FaDesktop className="text-[10px]" /> Screen
                    </div>
                  </div>
                )}
                {webcamEnabled && (
                  <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative">
                    <video ref={webcamVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 opacity-80" />
                    <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-1.5 rounded flex items-center gap-1">
                      <FaVideo className="text-[10px]" /> Webcam
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Conversation Log */}
          <div className="w-2/3 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2 shrink-0">
              <FaCommentDots className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">Live Transcript & Context</h2>
              <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {Math.min(conversation.length, 32)} / 32 buffer
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {conversation.length === 0 && !liveTranscript && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Conversation history will appear here once you start speaking...
                </div>
              )}
              
              {conversation.map((msg, i) => (
                <div key={msg.id} className={`flex ${msg.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${
                    msg.speaker === 'ai' 
                      ? 'bg-blue-50 border border-blue-100 text-blue-900 rounded-tl-sm' 
                      : 'bg-green-50 border border-green-100 text-green-900 rounded-tr-sm'
                  }`}>
                    <div className="text-xs font-bold mb-1 opacity-60">
                      {msg.speaker === 'ai' ? 'Alex (AI)' : 'You'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              
              {liveTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 rounded-tr-sm">
                    <div className="text-xs font-bold mb-1 opacity-60">You (Speaking...)</div>
                    <div className="text-sm italic">{liveTranscript}</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-center gap-6 shrink-0">
          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl w-24 transition-colors ${
              micEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {micEnabled ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            <span className="text-xs font-semibold">{micEnabled ? 'Mute' : 'Unmute'}</span>
          </button>

          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl w-24 transition-colors ${
              screenEnabled ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaDesktop size={20} />
            <span className="text-xs font-semibold">{screenEnabled ? 'Stop Share' : 'Share Screen'}</span>
          </button>

          <button
            onClick={toggleWebcam}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl w-24 transition-colors ${
              webcamEnabled ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {webcamEnabled ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            <span className="text-xs font-semibold">{webcamEnabled ? 'Stop Cam' : 'Share Cam'}</span>
          </button>

          <div className="w-px h-10 bg-gray-200 mx-2"></div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl w-24 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <FaSignOutAlt size={20} />
            <span className="text-xs font-semibold">Leave</span>
          </button>
        </div>
      </div>
    </V2Layout>
  );
}
