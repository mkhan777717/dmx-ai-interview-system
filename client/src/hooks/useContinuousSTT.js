import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ServerUrl } from '../App';

export default function useContinuousSTT({
  onTranscript,
  onUtterance,
  recording = false,
  silenceThresholdMs = 1500, // 1.5s of silence marks end of utterance
}) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const streamRef = useRef(null);
  
  // Track continuous accumulated transcript
  const accumulatedTranscript = useRef('');
  // Track silence for utterance boundary
  const silenceTimer = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const formData = new FormData();
          formData.append('audio', new File([e.data], 'chunk.webm', { type: mimeType }));
          
          try {
            const res = await axios.post(`${ServerUrl}/api/v2/transcribe`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const text = res.data.transcript?.trim();
            if (text) {
              const newText = (accumulatedTranscript.current + ' ' + text).trim();
              accumulatedTranscript.current = newText;
              
              if (onTranscript) {
                onTranscript(newText, false);
              }
              
              // Reset silence timer
              if (silenceTimer.current) clearTimeout(silenceTimer.current);
              silenceTimer.current = setTimeout(() => {
                if (accumulatedTranscript.current && onUtterance) {
                  onUtterance(accumulatedTranscript.current);
                  accumulatedTranscript.current = ''; // Reset for next utterance
                  if (onTranscript) onTranscript('', true); // Clear live feed
                }
              }, silenceThresholdMs);
            }
          } catch (err) {
            console.error('Transcription chunk error:', err);
          }
        }
      };

      // Request data chunks every 3 seconds for near real-time updates
      recorder.start(3000);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
    }
  }, [onTranscript, onUtterance, silenceThresholdMs]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    
    // Flush remaining transcript immediately
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    if (accumulatedTranscript.current && onUtterance) {
      onUtterance(accumulatedTranscript.current);
      accumulatedTranscript.current = '';
      if (onTranscript) onTranscript('', true);
    }
  }, [onTranscript, onUtterance]);

  useEffect(() => {
    if (recording && !isRecording) startRecording();
    if (!recording && isRecording) stopRecording();
    
    return () => {
      if (isRecording) stopRecording();
    };
  }, [recording, isRecording, startRecording, stopRecording]);

  return { isRecording, startRecording, stopRecording };
}
