import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle, LogIn } from 'lucide-react';

const AppointmentsTable = ({ appointments, services, staff, onCheckIn, loading }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);

  const formatDateTime = (val) => {
    if (!val) return '-';
    try {
      const d = val?.toDate?.() || (val instanceof Date ? val : new Date(val));
      return d.toLocaleString();
    } catch (e) {
      return String(val);
    }
  };

  const handleCheckIn = async (appointment) => {
    setCheckingInId(appointment.id);
    try {
      await onCheckIn(appointment);
    } finally {
      setCheckingInId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Pending' },
      'confirmed': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Confirmed' },
      'completed': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Completed' },
      'cancelled': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Cancelled' }
    };
    return colors[status?.toLowerCase()] || colors['pending'];
  };

  const getSourceBadge = (source) => {
    if (source === 'frontend') {
      return {
        bg: 'rgba(168, 85, 247, 0.1)',
        color: '#a855f7',
        text: 'Web Booking'
      };
    }
    return {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
      text: 'Admin'
    };
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'var(--admin-card-bg)',
        borderRadius: 'var(--admin-radius)',
        border: '1px solid var(--admin-border)'
      }}>
        <AlertCircle size={32} style={{ color: 'var(--admin-muted-foreground)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--admin-muted-foreground)', margin: 0 }}>No appointments on reception</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--admin-card-bg)',
      borderRadius: 'var(--admin-radius)',
      overflow: 'hidden',
      border: '1px solid var(--admin-border)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {appointments.map((appointment, idx) => {
        const statusColor = getStatusColor(appointment.status);
        const sourceColor = getSourceBadge(appointment.source);
        const isExpanded = expandedId === appointment.id;

        return (
          <div key={appointment.id || idx} style={{
            borderBottom: idx < appointments.length - 1 ? '1px solid var(--admin-border)' : 'none',
            padding: '1rem'
          }}>
            {/* Header Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: isExpanded ? '1rem' : '0'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: statusColor.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: statusColor.color
                  }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h3 style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--admin-foreground)'
                    }}>
                      {appointment.customerName}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        background: statusColor.bg,
                        color: statusColor.color,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontWeight: 600
                      }}>
                        {statusColor.text}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        background: sourceColor.bg,
                        color: sourceColor.color,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontWeight: 600
                      }}>
                        {sourceColor.text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  marginTop: '0.75rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-muted-foreground)' }}>
                    <Calendar size={16} /> {formatDateTime(appointment.appointmentDate)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-muted-foreground)' }}>
                    <Clock size={16} /> {appointment.appointmentTime}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-muted-foreground)' }}>
                    <User size={16} /> {appointment.stylistName || 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : appointment.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-sm)',
                    color: 'var(--admin-muted-foreground)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--admin-muted)';
                    e.currentTarget.style.color = 'var(--admin-foreground)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--admin-muted-foreground)';
                  }}
                >
                  {isExpanded ? 'Hide' : 'Details'}
                </button>

                <button
                  onClick={() => handleCheckIn(appointment)}
                  disabled={checkingInId === appointment.id || loading}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--admin-success)',
                    border: 'none',
                    borderRadius: 'var(--admin-radius-sm)',
                    color: 'white',
                    cursor: checkingInId === appointment.id || loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    opacity: checkingInId === appointment.id || loading ? 0.6 : 1
                  }}
                  onMouseEnter={e => {
                    if (checkingInId !== appointment.id && !loading) {
                      e.currentTarget.style.background = '#059669';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (checkingInId !== appointment.id && !loading) {
                      e.currentTarget.style.background = 'var(--admin-success)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <LogIn size={16} />
                  {checkingInId === appointment.id ? 'Checking...' : 'Check In'}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div style={{
                borderTop: '1px solid var(--admin-border)',
                paddingTop: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {/* Customer Info */}
                  <div>
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--admin-muted-foreground)',
                      textTransform: 'uppercase'
                    }}>Customer Info</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={16} style={{ color: 'var(--admin-muted-foreground)' }} />
                        <span>{appointment.customerPhone || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} style={{ color: 'var(--admin-muted-foreground)' }} />
                        <span>{appointment.customerEmail || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div>
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--admin-muted-foreground)',
                      textTransform: 'uppercase'
                    }}>Service Info</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{appointment.serviceName || 'Service not specified'}</span>
                      </div>
                      {appointment.notes && (
                        <div>
                          <span style={{ color: 'var(--admin-muted-foreground)' }}><strong>Notes:</strong> {appointment.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div>
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--admin-muted-foreground)',
                      textTransform: 'uppercase'
                    }}>Appointment Details</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div><strong>Date:</strong> {formatDateTime(appointment.appointmentDate)}</div>
                      <div><strong>Time:</strong> {appointment.appointmentTime}</div>
                      <div><strong>Stylist:</strong> {appointment.stylistName || 'Unassigned'}</div>
                      <div><strong>Source:</strong> {appointment.source === 'frontend' ? 'Web Booking' : 'Admin'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentsTable;
