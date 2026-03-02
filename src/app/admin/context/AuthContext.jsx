import { createContext, useState, useEffect } from 'react';
import { auth, db } from '../../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      async (currentUser) => {
        if (currentUser) {
          try {
            // Fetch user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role || 'admin');
            } else {
              // Default to admin if no user doc found (for new registrations)
              setUserRole('admin');
            }
          } catch (err) {
            console.error('Error fetching user role:', err);
            setUserRole('admin'); // Default to admin on error
          }
        } else {
          setUserRole(null);
        }
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

