import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle, LogIn, XCircle, Filter, RefreshCw } from 'lucide-react';
import { getFrontendBookings, updateAppointmentStatus, checkInAppointment } from '../utils/firebaseUtils';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'today', 'all', 'expired'
  const [checkingInId, setCheckingInId] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await getFrontendBookings(filter === 'all' || filter === 'expired');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let filtered = data;
      
      if (filter === 'today') {
        filtered = data.filter(apt => {
          const aptDate = apt.appointmentDate instanceof Date ? apt.appointmentDate : new Date(apt.appointmentDate);
          const aptDay = new Date(aptDate);
          aptDay.setHours(0, 0, 0, 0);
          return aptDay.getTime() === today.getTime();
        });
      } else if (filter === 'upcoming') {
        filtered = data.filter(apt => {
          const aptDate = apt.appointmentDate instanceof Date ? apt.appointmentDate : new Date(apt.appointmentDate);
          return aptDate >= today && apt.status !== 'checked-in' && apt.status !== 'cancelled';
        });
      } else if (filter === 'expired') {
        filtered = data.filter(apt => {
          const aptDate = apt.appointmentDate instanceof Date ? apt.appointmentDate : new Date(apt.appointmentDate);
          return aptDate < today && apt.status !== 'checked-in' && apt.status !== 'cancelled';
        });
      }
      
      setAppointments(filtered);
      setError('');
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const handleCheckIn = async (appointment) => {
    setCheckingInId(appointment.id);
    try {
      await checkInAppointment(appointment);
      setSuccess(`${appointment.customerName} checked in successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchAppointments();
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Failed to check in: ' + err.message);
    } finally {
      setCheckingInId(null);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await updateAppointmentStatus(appointment.dateFolder, appointment.id, 'cancelled');
      setSuccess('Appointment cancelled');
      setTimeout(() => setSuccess(''), 3000);
      fetchAppointments();
    } catch (err) {
      console.error('Cancel error:', err);
      setError('Failed to cancel appointment');
    }
  };

  const handleMarkExpired = async (appointment) => {
    try {
      await updateAppointmentStatus(appointment.dateFolder, appointment.id, 'expired');
      setSuccess('Appointment marked as expired');
      setTimeout(() => setSuccess(''), 3000);
      fetchAppointments();
    } catch (err) {
      console.error('Error marking expired:', err);
      setError('Failed to mark as expired');
    }
  };

  const formatDateTime = (val) => {
    if (!val) return '-';
    try {
      const d = val?.toDate?.() || (val instanceof Date ? val : new Date(val));
      return d.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return String(val);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Pending' },
      'confirmed': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Confirmed' },
      'checked-in': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', text: 'Checked In' },
      'completed': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Completed' },
      'cancelled': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Cancelled' },
      'expired': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', text: 'Expired' }
    };
    return colors[status?.toLowerCase()] || colors['pending'];
  };

  const isExpired = (appointment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = appointment.appointmentDate instanceof Date ? appointment.appointmentDate : new Date(appointment.appointmentDate);
    return aptDate < today;
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-foreground)' }}>
          <Calendar style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={24} />
          Appointments
        </h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={fetchAppointments}
            style={{
              padding: '0.5rem',
              background: 'var(--admin-muted)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={18} />
          </button>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--admin-input-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius-sm)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="upcoming">Upcoming</option>
            <option value="today">Today Only</option>
            <option value="all">All</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: 'var(--admin-danger-light)',
          border: '1px solid #fca5a5',
          color: 'var(--admin-danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--admin-radius-sm)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'var(--admin-success-light)',
          border: '1px solid #a7f3d0',
          color: 'var(--admin-success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--admin-radius-sm)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ marginTop: '1rem', color: 'var(--admin-muted-foreground)' }}>Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'var(--admin-card-bg)',
          borderRadius: 'var(--admin-radius)',
          border: '1px solid var(--admin-border)'
        }}>
          <Calendar size={48} style={{ color: 'var(--admin-muted-foreground)', opacity: 0.5, margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--admin-muted-foreground)', margin: 0 }}>
            No {filter === 'upcoming' ? 'upcoming' : filter === 'today' ? "today's" : filter === 'expired' ? 'expired' : ''} appointments found
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--admin-card-bg)',
          borderRadius: 'var(--admin-radius)',
          overflow: 'hidden',
          border: '1px solid var(--admin-border)'
        }}>
          {appointments.map((appointment, idx) => {
            const statusColor = getStatusColor(appointment.status);
            const expired = isExpired(appointment);
            const canCheckIn = !expired && appointment.status !== 'checked-in' && appointment.status !== 'cancelled';

            return (
              <div key={appointment.id || idx} style={{
                borderBottom: idx < appointments.length - 1 ? '1px solid var(--admin-border)' : 'none',
                padding: '1rem',
                opacity: expired && appointment.status !== 'checked-in' ? 0.7 : 1
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  {/* Customer Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--admin-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--admin-primary)',
                        fontWeight: 600,
                        fontSize: '1rem'
                      }}>
                        {appointment.customerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--admin-foreground)' }}>
                          {appointment.customerName}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted-foreground)' }}>
                          <Phone size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {appointment.customerPhone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-foreground)' }}>
                        <Calendar size={16} /> {formatDateTime(appointment.appointmentDate)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-muted-foreground)' }}>
                        <Clock size={16} /> {appointment.appointmentTime}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-muted-foreground)' }}>
                        <User size={16} /> {appointment.stylistName || 'Any Stylist'}
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--admin-muted)',
                      borderRadius: 'var(--admin-radius-sm)',
                      fontSize: '0.875rem'
                    }}>
                      {appointment.serviceName || 'Service not specified'}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      background: statusColor.bg,
                      color: statusColor.color,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontWeight: 600
                    }}>
                      {expired && appointment.status === 'pending' ? 'Expired' : statusColor.text}
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canCheckIn && (
                        <button
                          onClick={() => handleCheckIn(appointment)}
                          disabled={checkingInId === appointment.id}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'var(--admin-success)',
                            border: 'none',
                            borderRadius: 'var(--admin-radius-sm)',
                            color: 'white',
                            cursor: checkingInId === appointment.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            opacity: checkingInId === appointment.id ? 0.6 : 1
                          }}
                        >
                          <LogIn size={14} />
                          {checkingInId === appointment.id ? 'Checking...' : 'Check In'}
                        </button>
                      )}

                      {appointment.status !== 'cancelled' && appointment.status !== 'checked-in' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'transparent',
                            border: '1px solid var(--admin-danger)',
                            borderRadius: 'var(--admin-radius-sm)',
                            color: 'var(--admin-danger)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {appointment.notes && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--admin-muted)',
                    borderRadius: 'var(--admin-radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--admin-muted-foreground)'
                  }}>
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Appointments;
