import React, { useState, useEffect } from 'react';
import { mockDatabase } from '../data/mockDatabase';
import { DollarSign, CheckSquare, Coffee, Clipboard, Compass, Info } from 'lucide-react';
import { agentTools } from '../agents/tools';

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockDatabase.getDatabaseStats());
  const [bookings, setBookings] = useState(mockDatabase.getBookings());
  const [orders, setOrders] = useState(mockDatabase.getOrders());
  const [insights, setInsights] = useState([]);

  // Fetch updated data from DB
  const refreshData = () => {
    setStats(mockDatabase.getDatabaseStats());
    setBookings(mockDatabase.getBookings());
    setOrders(mockDatabase.getOrders());
  };

  // Generate analytics insights on load
  useEffect(() => {
    const report = agentTools.generateAnalyticsReport();
    if (report.success) {
      setInsights(report.result.recommendations);
    }
  }, [bookings, orders]);

  const handleUpdateBooking = (id, newStatus) => {
    mockDatabase.updateBookingStatus(id, newStatus);
    refreshData();
  };

  const handleUpdateOrder = (id, newStatus) => {
    mockDatabase.updateOrderStatus(id, newStatus);
    refreshData();
  };

  // Pre-calculate room booking types for the bar chart
  const roomCounts = {
    "Standard Room": 0,
    "Deluxe Room": 0,
    "Luxury Suite": 0
  };
  bookings.forEach(b => {
    if (roomCounts[b.roomType] !== undefined) {
      roomCounts[b.roomType]++;
    }
  });

  const maxCount = Math.max(...Object.values(roomCounts), 1);

  return (
    <div className="admin-dashboard-container">
      {/* Dashboard Header */}
      <div className="dash-header">
        <div>
          <h1>Executive Operations Panel</h1>
          <p>Real-time analytics and transaction management logs</p>
        </div>
        <div className="last-sync">
          <span>Live Sync Active</span>
          <span className="pulse-dot"></span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <DollarSign size={20} />
          </div>
          <div className="kpi-info">
            <span>Total Revenue</span>
            <h3>${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p>${stats.roomRevenue.toLocaleString()} Rooms • ${stats.foodRevenue.toLocaleString()} F&B</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon occupancy">
            <CheckSquare size={20} />
          </div>
          <div className="kpi-info">
            <span>Occupancy Rate</span>
            <h3>{stats.occupancyRate}%</h3>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${stats.occupancyRate}%` }}></div>
            </div>
            <p>{stats.activeOccupied} of 10 Rooms Occupied</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bookings">
            <Clipboard size={20} />
          </div>
          <div className="kpi-info">
            <span>Total Bookings</span>
            <h3>{stats.totalBookings}</h3>
            <p>Active and completed rooms logs</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orders">
            <Coffee size={20} />
          </div>
          <div className="kpi-info">
            <span>Kitchen Orders</span>
            <h3>{stats.pendingOrders}</h3>
            <p>Pending and preparing room deliveries</p>
          </div>
        </div>
      </div>

      {/* Charts & AI Insights */}
      <div className="dashboard-charts-grid">
        {/* Chart 1: SVG Room Bookings Bar Chart */}
        <div className="chart-card">
          <h4>Room Booking Popularity</h4>
          <p className="chart-subtitle">Volume of bookings by room classification</p>
          <div className="svg-chart-container">
            <svg viewBox="0 0 400 220" className="bar-chart-svg">
              {/* Grid Lines */}
              <line x1="50" y1="30" x2="350" y2="30" stroke="#251C3E" strokeDasharray="4 4" />
              <line x1="50" y1="95" x2="350" y2="95" stroke="#251C3E" strokeDasharray="4 4" />
              <line x1="50" y1="160" x2="350" y2="160" stroke="#251C3E" strokeDasharray="4 4" />
              
              {/* Bars */}
              {Object.entries(roomCounts).map(([type, count], index) => {
                const barWidth = 40;
                const barSpacing = 95;
                const startX = 85 + index * barSpacing;
                // height scales between 10 and 130 pixels
                const barHeight = 10 + (count / maxCount) * 120;
                const startY = 160 - barHeight;
                
                return (
                  <g key={type}>
                    {/* Linear Gradient for bars */}
                    <defs>
                      <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#A78BFA" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    {/* Bar */}
                    <rect
                      x={startX}
                      y={startY}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={`url(#grad-${index})`}
                      className="svg-bar"
                    />
                    {/* Count text above bar */}
                    <text
                      x={startX + barWidth / 2}
                      y={startY - 8}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {count}
                    </text>
                    {/* X Axis Label */}
                    <text
                      x={startX + barWidth / 2}
                      y="180"
                      textAnchor="middle"
                      fill="#8E85B2"
                      fontSize="10"
                    >
                      {type.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
              
              {/* Ground line */}
              <line x1="40" y1="160" x2="360" y2="160" stroke="#4C3E72" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Chart 2: SVG Revenue Split donut or visual progress */}
        <div className="chart-card">
          <h4>Revenue Distribution</h4>
          <p className="chart-subtitle">Comparison between Room Bookings and F&B Sales</p>
          <div className="revenue-split-visual">
            <div className="pie-diagram-svg">
              <svg width="120" height="120" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#251C3E" strokeWidth="4" />
                {/* Rooms Segment (Purple) */}
                {stats.totalRevenue > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="4.2"
                    strokeDasharray={`${(stats.roomRevenue / stats.totalRevenue) * 100} ${100 - (stats.roomRevenue / stats.totalRevenue) * 100}`}
                    strokeDashoffset="25"
                  />
                )}
              </svg>
              <div className="pie-label">
                <span>Rooms</span>
                <strong>{stats.totalRevenue > 0 ? Math.round((stats.roomRevenue / stats.totalRevenue) * 100) : 0}%</strong>
              </div>
            </div>
            
            <div className="revenue-breakdown-details">
              <div className="rev-legend-item">
                <span className="legend-dot rooms"></span>
                <div className="legend-text">
                  <span className="legend-label">Rooms Lodging</span>
                  <strong>${stats.roomRevenue.toLocaleString()}</strong>
                </div>
              </div>
              <div className="rev-legend-item">
                <span className="legend-dot food"></span>
                <div className="legend-text">
                  <span className="legend-label">Food & Restaurant</span>
                  <strong>${stats.foodRevenue.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="chart-card insights-card">
          <div className="card-title-row">
            <Compass size={18} className="text-emerald" />
            <h4>AI Business Recommendations</h4>
          </div>
          <p className="chart-subtitle">Autonomous optimizations from DizinS Analytics Agent</p>
          <div className="insights-list">
            {insights.map((ins, idx) => (
              <div key={idx} className="insight-bullet">
                <div className="insight-bullet-icon">
                  <Info size={12} />
                </div>
                <p>{ins}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Management Tables Section */}
      <div className="management-tables-container">
        {/* Bookings Table */}
        <div className="table-wrapper">
          <div className="table-header-bar">
            <h3>Active Guest Bookings</h3>
            <span className="badge-count">{bookings.length} Booked</span>
          </div>
          <div className="scrollable-table">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room Type</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="td-name">{b.name}</div>
                      <div className="td-sub">{b.phone}</div>
                    </td>
                    <td>{b.roomType}</td>
                    <td>
                      <div className="td-date">{b.checkIn} to {b.checkOut}</div>
                    </td>
                    <td>{b.guests}</td>
                    <td>${b.totalPrice}</td>
                    <td>
                      <span className={`status-pill ${b.status.toLowerCase().replace(" ", "-")}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {b.status === "Confirmed" && (
                          <button className="btn-table checkin" onClick={() => handleUpdateBooking(b.id, "Checked In")}>
                            Check In
                          </button>
                        )}
                        {b.status === "Checked In" && (
                          <button className="btn-table complete" onClick={() => handleUpdateBooking(b.id, "Completed")}>
                            Complete
                          </button>
                        )}
                        {b.status !== "Completed" && b.status !== "Cancelled" && (
                          <button className="btn-table cancel" onClick={() => handleUpdateBooking(b.id, "Cancelled")}>
                            Cancel
                          </button>
                        )}
                        {(b.status === "Completed" || b.status === "Cancelled") && (
                          <span className="action-disabled">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Food Orders Table */}
        <div className="table-wrapper">
          <div className="table-header-bar">
            <h3>Kitchen & Dining Orders</h3>
            <span className="badge-count">{orders.length} orders</span>
          </div>
          <div className="scrollable-table">
            <table>
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Items Ordered</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.id}</strong></td>
                    <td>
                      <div className="td-name">{o.name}</div>
                      <div className="td-sub">{o.phone}</div>
                    </td>
                    <td>
                      <span className={`dest-pill ${o.deliveryType}`}>
                        {o.roomNumber}
                      </span>
                    </td>
                    <td>
                      <div className="ordered-items-summary">
                        {o.items.map((i, idx) => (
                          <div key={idx} className="order-item-line">
                            {i.quantity}x {i.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>${o.totalPrice.toFixed(2)}</td>
                    <td>
                      <span className={`status-pill ${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {o.status === "Pending" && (
                          <button className="btn-table prepare" onClick={() => handleUpdateOrder(o.id, "Preparing")}>
                            Prepare
                          </button>
                        )}
                        {o.status === "Preparing" && (
                          <button className="btn-table complete" onClick={() => handleUpdateOrder(o.id, "Delivered")}>
                            Deliver
                          </button>
                        )}
                        {o.status !== "Delivered" && o.status !== "Cancelled" && (
                          <button className="btn-table cancel" onClick={() => handleUpdateOrder(o.id, "Cancelled")}>
                            Cancel
                          </button>
                        )}
                        {(o.status === "Delivered" || o.status === "Cancelled") && (
                          <span className="action-disabled">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
