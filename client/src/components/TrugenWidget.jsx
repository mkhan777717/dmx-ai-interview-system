import React from 'react';
import '@aiteammate/agent-widget/styles.css';
import { TrugenAgentWidget } from '@aiteammate/agent-widget';

/**
 * TrugenWidget — Official AI Teammate / TruGen Avatar Widget
 * Connects to agentId: db56efae-05b0-4c3b-956c-914bc31e4c04
 */
export default function TrugenWidget({
  agentId = 'db56efae-05b0-4c3b-956c-914bc31e4c04',
  inline = true,
  onEndCall,
}) {
  return (
    <div className="w-full h-full min-h-[420px] flex items-center justify-center relative overflow-hidden rounded-2xl bg-black shadow-2xl">
      <TrugenAgentWidget agentId={agentId} inline={inline} onEndCall={onEndCall} />
    </div>
  );
}
