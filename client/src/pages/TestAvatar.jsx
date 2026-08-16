import React, { useRef, useState, useEffect } from 'react';
import VRMAvatarInterviewer from '../components/VRMAvatarInterviewer';

export default function TestAvatar() {
  const avatarRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [forceError, setForceError] = useState(false);

  const addLog = (msg) => setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  // Prefetch Question 2 on mount
  useEffect(() => {
    if (avatarRef.current) {
      addLog('Prefetching Question 2...');
      avatarRef.current.prefetch('This is the second question, prefetched in the background.');
    }
  }, []);

  const handleSpeak1 = () => {
    addLog('Speaking Question 1 (cold start)...');
    avatarRef.current?.speak('Hello there! This is the first question to test the avatar lip sync.');
  };

  const handleSpeak2 = () => {
    addLog('Speaking Question 2 (should be near instant due to prefetch)...');
    avatarRef.current?.speak('This is the second question, prefetched in the background.');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ flex: 1, padding: 20, borderRight: '1px solid #ccc' }}>
        <h2>Avatar Test Harness</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={handleSpeak1} style={{ padding: 10 }}>1. Speak Q1</button>
          <button onClick={handleSpeak2} style={{ padding: 10 }}>2. Speak Q2 (Prefetched)</button>
          <button onClick={() => setForceError(true)} style={{ padding: 10, color: 'red' }}>3. Force Fallback (Simulate Error)</button>
        </div>
        
        <div style={{ background: '#f5f5f5', padding: 10, height: 400, overflowY: 'auto' }}>
          <h4>Action Logs</h4>
          {logs.map((l, i) => <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>{l}</div>)}
        </div>
      </div>
      
      <div style={{ width: 400, background: '#1e293b', position: 'relative' }}>
        {!forceError ? (
          <VRMAvatarInterviewer 
            ref={avatarRef}
            persona={{ name: 'Alex', avatarFallback: '/agent.png' }}
            onStateChange={(state) => addLog(`Avatar State -> ${state}`)}
            onError={(err) => addLog(`Avatar Error -> ${err}`)}
          />
        ) : (
          // Simulate error by passing invalid vrmUrl or forcing it to error mode manually
          <VRMAvatarInterviewer 
             persona={{ name: 'Alex', avatarFallback: '/agent.png' }}
             onError={() => addLog(`Avatar Error forced`)}
          />
        )}
      </div>
    </div>
  );
}
