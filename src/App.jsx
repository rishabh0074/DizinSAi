import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import { agentOrchestrator } from './agents/orchestrator';
import { mockDatabase } from './data/mockDatabase';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatState, setChatState] = useState(agentOrchestrator.initializeContext());
  const [logs, setLogs] = useState(mockDatabase.getLogs());

  // Automatically load logs on tab switch
  useEffect(() => {
    setLogs(mockDatabase.getLogs());
  }, [activeTab, chatState]);

  const handleSendMessage = (messageText) => {
    // 1. Add user message to history
    const userMessage = {
      sender: "user",
      text: messageText,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [...chatState.history, userMessage];
    const contextWithUserMsg = {
      ...chatState,
      history: updatedHistory
    };

    // Trigger typing / processing log entry
    mockDatabase.addLog({
      agent: "System",
      action: "Message Ingest",
      details: `Received user query: "${messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText}"`
    });

    // 2. Pass to orchestrator
    const result = agentOrchestrator.handleMessage(messageText, contextWithUserMsg);
    
    // 3. Add agent response to history and update context state
    const agentMessage = {
      sender: "agent",
      text: result.reply,
      timestamp: new Date().toISOString()
    };

    const finalHistory = [...result.context.history, agentMessage];
    
    setChatState({
      ...result.context,
      history: finalHistory
    });
    
    setLogs(mockDatabase.getLogs());
  };

  const handleClearHistory = () => {
    // Reset orchestrator context but maintain DB records
    const freshContext = agentOrchestrator.initializeContext();
    setChatState(freshContext);
    
    mockDatabase.addLog({
      agent: "System",
      action: "Chat Reset",
      details: "Customer chat session log cleared."
    });
    
    setLogs(mockDatabase.getLogs());
  };

  const handleResetDB = () => {
    if (window.confirm("Are you sure you want to reset the localStorage database? All custom bookings and food orders will be restored to seed data.")) {
      mockDatabase.resetDatabase();
      const freshContext = agentOrchestrator.initializeContext();
      setChatState(freshContext);
      setLogs(mockDatabase.getLogs());
      setActiveTab('chat');
      alert("Database has been reset to default seeds.");
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Nav */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onResetDB={handleResetDB} />

      {/* Main Screen Panel */}
      <main className="main-content">
        {activeTab === 'chat' && (
          <ChatInterface 
            chatState={chatState} 
            onSendMessage={handleSendMessage} 
            onClearHistory={handleClearHistory} 
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}

        {activeTab === 'logs' && (
          <div className="audit-logs-container">
            <div className="logs-title-row">
              <div>
                <h1>System Security Audit Trail</h1>
                <span className="text-muted">Real-time log of multi-agent states and tool executions</span>
              </div>
            </div>

            <div className="logs-terminal-viewport">
              {logs.length === 0 ? (
                <div className="log-row">
                  <span className="log-details">[Idle] No database actions registered yet.</span>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="log-row">
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`log-badge ${log.agent.toLowerCase().replace(" ", "-")}`}>
                      [{log.agent}]
                    </span>
                    <span className="log-action">
                      {log.action}
                    </span>
                    <span className="log-details">
                      {log.details}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
