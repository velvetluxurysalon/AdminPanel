import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  where,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// ============================================
// REFERRAL MANAGEMENT
// ============================================

export const getAllReferrals = async () => {
  try {
    const q = query(collection(db, "referrals"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting all referrals:", error);
    throw error;
  }
};

export const getReferralSettings = async () => {
  try {
    const docRef = doc(db, "settings", "referralSettings");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Default settings if none exist
    return {
      pointsPerRupee: 1.0,
      redemptionRate: 20,
      referrerRewardType: "match_referee",
    };
  } catch (error) {
    console.error("Error getting referral settings:", error);
    throw error;
  }
};

export const updateReferralSettings = async (settings) => {
  try {
    await setDoc(doc(db, "settings", "referralSettings"), {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating referral settings:", error);
    throw error;
  }
};

export const getLatestVisitForCustomer = async (customerId) => {
  try {
    const q = query(
      collection(db, "visits"),
      where("customerId", "==", customerId),
      orderBy("date", "desc"),
      limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting latest visit:", error);
    throw error;
  }
};

export const getReferralForReferee = async (refereePhone) => {
  try {
    const q = query(
      collection(db, "referrals"),
      where("newCustomerPhone", "==", refereePhone),
      where("status", "==", "pending"),
      limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting referral for referee:", error);
    throw error;
  }
};

export const markReferralAsCompleted = async (
  referralId,
  pointsAwarded,
  invoiceId,
) => {
  try {
    await updateDoc(doc(db, "referrals", referralId), {
      status: "completed",
      pointsAwardedToReferrer: pointsAwarded,
      completedAt: serverTimestamp(),
      invoiceId: invoiceId,
    });
  } catch (error) {
    console.error("Error completing referral:", error);
    throw error;
  }
};
