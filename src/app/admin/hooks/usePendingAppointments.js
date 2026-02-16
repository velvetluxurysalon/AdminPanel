import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export const usePendingAppointments = () => {
  const [pendingCount, setPendingCount] = useState(0);

  const countPendingAppointments = async () => {
    try {
      let totalCount = 0;
      const datesToCheck = [];
      
      // Generate dates for a more reasonable range (e.g., last 7 days to next 30 days)
      const today = new Date();
      for (let i = -7; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        datesToCheck.push(dateString);
      }
      
      // Check each date folder
      for (const dateStr of datesToCheck) {
        try {
          const bookingsRef = collection(db, `appointments/${dateStr}/bookings`);
          const bookingsSnapshot = await getDocs(bookingsRef);
          
          // Filter pending and confirmed appointments
          const pendingDocs = bookingsSnapshot.docs.filter(doc => {
            const status = doc.data().status;
            return status === 'pending' || status === 'confirmed';
          });
          
          totalCount += pendingDocs.length;
        } catch (err) {
          // Date folder doesn't exist, continue
        }
      }
      
      return totalCount;
    } catch (error) {
      console.error('Error counting pending appointments:', error);
      return 0;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchAndUpdate = async () => {
      const count = await countPendingAppointments();
      if (isMounted) {
        setPendingCount(count);
      }
    };

    // Fetch immediately on mount
    fetchAndUpdate();

    // Poll every 60 seconds for real-time updates (much more stable than 2s)
    intervalId = setInterval(fetchAndUpdate, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return pendingCount;
};
