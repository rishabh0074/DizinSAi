import React from 'react';
import { MessageSquare, BarChart3, Database, Bot, RefreshCw } from 'lucide-react';
import { mockDatabase } from '../data/mockDatabase';

export default function Sidebar({ activeTab, setActiveTab, onResetDB }) {
  const menuItems = [
    { id: 'chat', label: 'Customer Portal', icon: MessageSquare },
    { id: 'admin', label: 'Admin Dashboard', icon: BarChart3 },
    { id: 'logs', label: 'System Logs', icon: Database },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Bot size={24} />
        </div>
        <div className="brand-text">
          <h1>DizinS AI</h1>
          <span>Hospitality Engine</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-reset" onClick={onResetDB} title="Reset all databases in localStorage">
          <RefreshCw size={16} />
          <span>Reset Database</span>
        </button>
      </div>
    </aside>
  );
}
