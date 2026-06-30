import React from 'react';
import { Terminal, Shield, Cpu, RefreshCw, Layers } from 'lucide-react';

export default function AgentLogPanel({ activeAgent, thought, toolCall, toolResult }) {
  const getAgentLabel = (agent) => {
    switch (agent) {
      case 'booking': return 'Booking Agent';
      case 'food': return 'Food Ordering Agent';
      case 'faq': return 'FAQ Agent';
      case 'analytics': return 'Admin Analytics Agent';
      default: return 'Idle Orchestrator';
    }
  };

  const getAgentColor = (agent) => {
    switch (agent) {
      case 'booking': return '#8B5CF6'; // purple
      case 'food': return '#F59E0B'; // amber
      case 'faq': return '#3B82F6'; // blue
      case 'analytics': return '#10B981'; // emerald
      default: return '#6B7280'; // gray
    }
  };

  return (
    <div className="agent-log-panel">
      <div className="panel-header">
        <Terminal size={18} />
        <h2>Agent Execution Log</h2>
      </div>

      <div className="panel-content">
        {/* Active Agent Status Card */}
        <div className="agent-status-card" style={{ borderColor: getAgentColor(activeAgent) }}>
          <div className="status-label">
            <Cpu size={16} style={{ color: getAgentColor(activeAgent) }} />
            <span>Active Worker Context:</span>
          </div>
          <div className="agent-badge" style={{ backgroundColor: `${getAgentColor(activeAgent)}20`, color: getAgentColor(activeAgent) }}>
            {getAgentLabel(activeAgent)}
          </div>
        </div>

        {/* Thought / Reasoning Stream */}
        <div className="panel-section">
          <div className="section-title">
            <Layers size={14} />
            <span>Agent Reasoning (Thought)</span>
          </div>
          <div className="thought-bubble-terminal">
            <p>{thought || "System is idle. Awaiting customer prompt to trigger routing analysis."}</p>
          </div>
        </div>

        {/* Tool Call Log */}
        <div className="panel-section">
          <div className="section-title">
            <Shield size={14} />
            <span>Tool Calling Execution</span>
          </div>
          {toolCall ? (
            <div className="tool-call-details">
              <div className="tool-badge">
                <span>fn:</span> {toolCall.name}
              </div>
              
              <div className="code-block-container">
                <span className="code-label">Arguments:</span>
                <pre className="code-block">
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </pre>
              </div>

              {toolResult && (
                <div className="code-block-container result">
                  <span className="code-label">Return Value:</span>
                  <pre className="code-block">
                    {JSON.stringify(toolResult.result, null, 2)}
                  </pre>
                  <div className={`tool-status ${toolResult.success ? 'success' : 'failed'}`}>
                    <span>Status:</span> {toolResult.success ? 'SUCCESS' : 'FAILED'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-tool-call">
              <span>No tool executed in this cycle.</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="panel-footer">
        <div className="security-indicator">
          <Shield size={12} />
          <span>Secure Agent Validation Layer Active</span>
        </div>
      </div>
    </div>
  );
}
