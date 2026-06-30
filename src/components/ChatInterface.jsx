import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, XCircle } from 'lucide-react';
import AgentLogPanel from './AgentLogPanel';

export default function ChatInterface({ chatState, onSendMessage, onClearHistory }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleQuickReply = (text) => {
    onSendMessage(text);
  };

  return (
    <div className="chat-layout-wrapper">
      {/* Messaging Pane */}
      <div className="chat-pane">
        <div className="chat-pane-header">
          <div className="header-agent-info">
            <div className="avatar">
              <Bot size={22} />
            </div>
            <div>
              <h3>DizinS AI Concierge</h3>
              <p>Online • Multi-Agent System</p>
            </div>
          </div>
          <button className="btn-clear-chat" onClick={onClearHistory} title="Clear Chat History">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages-container">
          {chatState.history.map((msg, index) => (
            <div key={index} className={`message-bubble-row ${msg.sender === 'user' ? 'user-row' : 'agent-row'}`}>
              <div className="avatar-icon">
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className="message-bubble">
                {msg.text.split('\n').map((line, lIdx) => (
                  <p key={lIdx}>{line}</p>
                ))}
              </div>
              <span className="msg-time">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Active Dialog Reminder Banner */}
        {chatState.activeAgent && (
          <div className="active-agent-banner">
            <span className="pulse-dot"></span>
            <span>You are currently in a **{chatState.activeAgent.toUpperCase()}** conversation flow.</span>
            <button className="btn-cancel-session" onClick={() => handleQuickReply("cancel")}>
              <XCircle size={14} />
              <span>Cancel</span>
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="quick-suggestions-container">
          <button className="suggest-chip" onClick={() => handleQuickReply("I want to book a Deluxe Room")}>
            🏨 Book Room
          </button>
          <button className="suggest-chip" onClick={() => handleQuickReply("Let's order some food")}>
            🍔 Order Food
          </button>
          <button className="suggest-chip" onClick={() => handleQuickReply("What are the check-in and check-out timings?")}>
            🕒 Hours FAQ
          </button>
          <button className="suggest-chip" onClick={() => handleQuickReply("Do you have free Wi-Fi and swimming pool?")}>
            🏊 Services FAQ
          </button>
          <button className="suggest-chip" onClick={() => handleQuickReply("Show revenue report summary")}>
            📊 Admin Report
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            placeholder="Type a message or select a suggestion above..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn-send">
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Diagnostics Agent Log Panel */}
      <AgentLogPanel
        activeAgent={chatState.activeAgent}
        thought={chatState.currentThought}
        toolCall={chatState.currentToolCall}
        toolResult={chatState.currentToolResult}
      />
    </div>
  );
}
