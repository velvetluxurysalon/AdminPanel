import React, { useState, useEffect } from 'react';
import { Bell, X, Calendar, User, Phone, Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { soundManager } from '../utils/soundManager';

const AppointmentNotification = () => {
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMuted, setIsMuted] = useState(soundManager.isSoundMuted());

  // Listen to all pending appointments across all dates
  useEffect(() => {
    try {
      // Get the appointments root collection and listen to all subcollections
      const appointmentsRef = collection(db, 'appointments');
      
      const unsubscribe = onSnapshot(appointmentsRef, async (snapshot) => {
        let allPendingAppointments = [];
        let latestAppointment = null;
        let latestTime = 0;

        // Process each date folder
        for (const dateDoc of snapshot.docs) {
          try {
            const bookingsRef = collection(db, `appointments/${dateDoc.id}/bookings`);
            const q = query(bookingsRef, where('status', '==', 'pending'));
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              const createdTime = data.createdAt?.toMillis?.() || 0;
              
              allPendingAppointments.push({
                id: doc.id,
                dateFolder: dateDoc.id,
                ...data,
                createdTime
              });

              // Track the most recent appointment
              if (createdTime > latestTime) {
                latestTime = createdTime;
                latestAppointment = {
                  id: doc.id,
                  dateFolder: dateDoc.id,
                  ...data
                };
              }
            });
          } catch (err) {
            console.log(`Note: Date folder ${dateDoc.id} may not exist or is empty`);
          }
        }

        setPendingCount(allPendingAppointments.length);

        // Show notification for new appointments
        if (latestAppointment && (!lastNotificationTime || (latestTime - lastNotificationTime) > 4000)) {
          setNotification({
            id: latestAppointment.id,
            ...latestAppointment,
            customerName: latestAppointment.customerName || 'New Customer',
            customerPhone: latestAppointment.customerPhone || 'N/A',
            appointmentTime: latestAppointment.appointmentTime || 'TBD',
            serviceName: latestAppointment.serviceName || 'Service',
            stylistName: latestAppointment.stylistName || 'Staff'
          });
          setShowNotification(true);
          setLastNotificationTime(latestTime);

          // Play notification sound
          playNotificationSound();

          // Auto-dismiss after 8 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 8000);
        }
      }, (error) => {
        console.error('Error listening to appointments:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up appointment listener:', error);
    }
  }, [lastNotificationTime]);

  // Play notification sound using sound manager
  const playNotificationSound = () => {
    soundManager.playAppointmentSound();
  };

  // Toggle sound mute
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      {/* Notification Badge Count */}
      {pendingCount > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            left: '85px',
            zIndex: 9998,
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '0.25rem 0.5rem',
            background: '#ef4444',
            color: 'white',
            borderRadius: '999px',
            minWidth: '20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            pointerEvents: 'none'
          }}
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </div>
      )}

      {/* Sound Mute Toggle Button */}
      <button
        onClick={handleToggleMute}
        title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9997,
          padding: '0.5rem',
          background: isMuted ? '#e5e7eb' : '#667eea',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          color: isMuted ? '#6b7280' : 'white'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Notification Popup */}
      {showNotification && notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            animation: 'slideInRight 0.4s ease-out'
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes slideOutRight {
              from {
                transform: translateX(0);
                opacity: 1;
              }
              to {
                transform: translateX(400px);
                opacity: 0;
              }
            }
            .notification-exit {
              animation: slideOutRight 0.4s ease-in forwards;
            }
          `}</style>

          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
              padding: '1.5rem',
              color: 'white',
              maxWidth: '420px',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Animated background accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Header with bell icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bell size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>New Appointment!</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>Just booked from website</p>
                </div>
              </div>

              {/* Customer details */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                {/* Customer name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <User size={18} style={{ opacity: 0.9 }} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{notification.customerName}</span>
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Phone size={18} style={{ opacity: 0.9 }} />
                  <span style={{ fontSize: '0.9rem' }}>{notification.customerPhone}</span>
                </div>

                {/* Service */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <MapPin size={18} style={{ opacity: 0.9 }} />
                  <span style={{ fontSize: '0.9rem' }}>{notification.serviceName}</span>
                </div>

                {/* Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} style={{ opacity: 0.9 }} />
                  <span style={{ fontSize: '0.9rem' }}>
                    {new Date(notification.appointmentDate).toLocaleDateString()} at {notification.appointmentTime}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => {
                  setShowNotification(false);
                  // Navigate to appointments page
                  window.location.href = '/admin/appointments';
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.35)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                View & Manage
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowNotification(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 3
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentNotification;
