import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db, storage } from "../../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  deleteField,
  runTransaction,
} from "firebase/firestore";

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === "function")
    return timestamp.toDate();
  if (typeof timestamp === "object" && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
};

// ============================================
// AUTHENTICATION & ADMIN MANAGEMENT
// ============================================

export const registerUser = async (
  email,
  password,
  displayName,
  role = "staff",
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // Create user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: displayName || "",
      createdAt: serverTimestamp(),
      role: role,
    });

    return userCredential.user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Verify user role
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error("User profile not found");
    }

    return { ...userCredential.user, ...userDoc.data() };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

export const getCurrentUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    throw error;
  }
};

// ============================================
// GENERIC FIRESTORE OPERATIONS
// ============================================

export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

export const getDocuments = async (collectionName, conditions = []) => {
  try {
    let q = collection(db, collectionName);

    if (conditions.length > 0) {
      const whereConditions = conditions
        .filter((c) => c.type === "where")
        .map((c) => where(c.field, c.operator, c.value));
      const orderByConditions = conditions
        .filter((c) => c.type === "orderBy")
        .map((c) => orderBy(c.field, c.direction || "asc"));
      const limitCondition = conditions.find((c) => c.type === "limit");

      const allConditions = [...whereConditions, ...orderByConditions];
      if (limitCondition) allConditions.push(limit(limitCondition.value));

      q = query(q, ...allConditions);
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    // Filter out undefined values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    await updateDoc(doc(db, collectionName, docId), {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

export const softDeleteDocument = async (collectionName, docId) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error soft deleting document:", error);
    throw error;
  }
};

export const restoreDocument = async (collectionName, docId) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      deletedAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error restoring document:", error);
    throw error;
  }
};

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

// Helper to normalize phone number (remove spaces, dashes, etc., and add +91 country code)
const normalizePhone = (phone) => {
  if (!phone) return "";
  let normalized = phone.replace(/[\s\-()]/g, "").trim();
  // Add +91 if not already present and starts with valid Indian number
  if (normalized && !normalized.startsWith("+")) {
    // If it starts with 91, just prepend +
    if (normalized.startsWith("91")) {
      normalized = "+" + normalized;
    } else {
      // Otherwise prepend +91
      normalized = "+91" + normalized;
    }
  }
  return normalized;
};

export const addCustomer = async (customerData) => {
  try {
    const phone = normalizePhone(
      customerData.contactNo || customerData.phone || "",
    );

    if (!phone) {
      throw new Error("Phone number is required");
    }

    // Check if customer with this phone already exists
    const existingDoc = await getDoc(doc(db, "customers", phone));
    if (existingDoc.exists()) {
      // Return existing customer data
      return {
        id: phone,
        ...existingDoc.data(),
      };
    }

    // Create customer with phone as document ID
    const customerDoc = {
      name: customerData.name || "",
      phone: phone,
      email: customerData.email || "",
      dateOfBirth: customerData.dateOfBirth || null, // New field for DOB
      gender: customerData.gender || "",
      isVerified: false,
      loyaltyPoints: 0,
      totalVisits: 0,
      totalSpent: 0,
      membershipType: customerData.membershipType || "regular",
      deletedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "customers", phone), customerDoc);

    // Create loyalty points collection for this customer
    await addDoc(collection(db, `customers/${phone}/pointsHistory`), {
      type: "initial",
      points: 0,
      amount: 0,
      description: "Account created",
      invoiceId: null,
      billDetails: null,
      transactionDate: serverTimestamp(),
    });

    return {
      id: phone,
      ...customerDoc,
    };
  } catch (error) {
    console.error("Error adding customer:", error);
    throw error;
  }
};

// Get customer by phone number (document ID)
export const getCustomerByPhone = async (phone) => {
  try {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return null;

    const docRef = doc(db, "customers", normalizedPhone);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting customer by phone:", error);
    return null;
  }
};

// Update customer to link with auth UID
export const linkCustomerToAuth = async (phone, authUid) => {
  try {
    const normalizedPhone = normalizePhone(phone);
    await updateDoc(doc(db, "customers", normalizedPhone), {
      authUid: authUid,
      isVerified: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error linking customer to auth:", error);
    throw error;
  }
};

// Update customer details
export const updateCustomer = async (phone, customerData) => {
  try {
    const normalizedPhone = normalizePhone(phone);

    // If phone is being updated, handle the document ID change
    const newPhone = customerData.phone
      ? normalizePhone(customerData.phone)
      : normalizedPhone;

    const updateData = {
      name: customerData.name || "",
      email: customerData.email || "",
      phone: newPhone,
      dateOfBirth: customerData.dateOfBirth || null, // Include DOB in update
      gender: customerData.gender || "",
      membershipType: customerData.membershipType || "regular",
      updatedAt: serverTimestamp(),
    };

    if (newPhone !== normalizedPhone) {
      // Phone number changed - need to migrate document
      // 1. Create new document with updated phone
      await setDoc(doc(db, "customers", newPhone), updateData);
      // 2. Copy subcollections if needed
      const pointsSnapshot = await getDocs(
        collection(db, `customers/${normalizedPhone}/pointsHistory`),
      );
      for (const doc of pointsSnapshot.docs) {
        await setDoc(
          doc(db, `customers/${newPhone}/pointsHistory/${doc.id}`),
          doc.data(),
        );
      }
      // 3. Delete old document
      await deleteDoc(doc(db, "customers", normalizedPhone));
    } else {
      // Phone unchanged - simple update
      await updateDoc(doc(db, "customers", normalizedPhone), updateData);
    }
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

export const getCustomers = async (includeDeleted = false) => {
  try {
    let customers = await getDocuments("customers", [
      { type: "orderBy", field: "createdAt", direction: "desc" },
    ]);
    if (!includeDeleted) {
      // Show customers where deletedAt is missing or null
      customers = customers.filter(
        (c) => c.deletedAt === undefined || c.deletedAt === null,
      );
    }
    return customers;
  } catch (error) {
    console.error("Error getting customers:", error);
    throw error;
  }
};

export const searchCustomers = async (searchTerm) => {
  try {
    const allCustomers = await getCustomers(false);
    // Search by phone (primary), name, or email - handle both phone and contactNo field names
    return allCustomers.filter((customer) => {
      const phone = customer.phone || customer.contactNo || "";
      const name = customer.name || "";
      const email = customer.email || "";

      return (
        phone.includes(searchTerm) ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  } catch (error) {
    console.error("Error searching customers:", error);
    throw error;
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    await softDeleteDocument("customers", customerId);
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

export const updateCustomerStats = async (customerId, amount) => {
  try {
    const customer = await getDocument("customers", customerId);
    if (customer) {
      await updateDocument("customers", customerId, {
        totalVisits: (customer.totalVisits || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + amount,
      });
    }
  } catch (error) {
    console.error("Error updating customer stats:", error);
    throw error;
  }
};

// ============================================
// LOYALTY POINTS MANAGEMENT
// ============================================

export const addLoyaltyPoints = async (
  customerId,
  points,
  amount,
  invoiceId,
  billDetails,
  description = "Points earned from purchase",
) => {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    // Update customer loyalty points only (NOT coins)
    const customer = await getDocument("customers", customerId);
    if (customer) {
      const newTotalPoints = (customer.loyaltyPoints || 0) + points;
      await updateDocument("customers", customerId, {
        loyaltyPoints: newTotalPoints,
      });
    }

    // Add entry to pointsHistory subcollection
    const pointsHistoryRef = collection(
      db,
      `customers/${customerId}/pointsHistory`,
    );
    const historyDocId = await addDoc(pointsHistoryRef, {
      type: "earned",
      points: points,
      amount: amount,
      invoiceId: invoiceId || null,
      billDetails: billDetails || {
        items: [],
        subtotal: amount,
        discount: 0,
        tax: 0,
        total: amount,
        paidAmount: amount,
      },
      description: description,
      transactionDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return historyDocId.id;
  } catch (error) {
    console.error("Error adding loyalty points:", error);
    throw error;
  }
};

export const getCustomerLoyaltyPoints = async (customerId) => {
  try {
    const customer = await getDocument("customers", customerId);
    return customer?.loyaltyPoints || 0;
  } catch (error) {
    console.error("Error getting customer loyalty points:", error);
    throw error;
  }
};

export const getCustomerPointsHistory = async (customerId) => {
  try {
    const pointsHistoryRef = collection(
      db,
      `customers/${customerId}/pointsHistory`,
    );
    const q = query(pointsHistoryRef, orderBy("transactionDate", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      transactionDate:
        doc.data().transactionDate?.toDate?.() || doc.data().transactionDate,
    }));
  } catch (error) {
    console.error("Error getting customer points history:", error);
    throw error;
  }
};

export const redeemLoyaltyPoints = async (
  customerId,
  pointsToRedeem,
  discountAmount,
  invoiceId,
  description = "Points redeemed for discount",
) => {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const customer = await getDocument("customers", customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const currentPoints = customer.loyaltyPoints || 0;
    if (currentPoints < pointsToRedeem) {
      throw new Error("Insufficient loyalty points");
    }

    // Update customer loyalty points
    const newTotalPoints = currentPoints - pointsToRedeem;
    await updateDocument("customers", customerId, {
      loyaltyPoints: newTotalPoints,
    });

    // Add redemption entry to pointsHistory
    const pointsHistoryRef = collection(
      db,
      `customers/${customerId}/pointsHistory`,
    );
    const historyDocId = await addDoc(pointsHistoryRef, {
      type: "redeemed",
      points: -pointsToRedeem,
      amount: discountAmount,
      invoiceId: invoiceId || null,
      description: description,
      transactionDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return historyDocId.id;
  } catch (error) {
    console.error("Error redeeming loyalty points:", error);
    throw error;
  }
};

// ============================================
// STAFF MANAGEMENT
// ============================================

export const addStaff = async (staffData) => {
  try {
    const staffId = await addDocument("staff", {
      name: staffData.name,
      phone: staffData.phone || "",
      email: staffData.email || "",
      role: staffData.role,
      specialties: Array.isArray(staffData.specialties)
        ? staffData.specialties
        : [],
      experience: staffData.experience || "",
      bio: staffData.bio || "",
      image: staffData.image || "",
      socials: {
        facebook: staffData.socials?.facebook || "",
        instagram: staffData.socials?.instagram || "",
        twitter: staffData.socials?.twitter || "",
      },
      active: true,
      totalVisits: 0,
      createdAt: serverTimestamp(),
    });
    return staffId;
  } catch (error) {
    console.error("Error adding staff:", error);
    throw error;
  }
};

export const getStaff = async () => {
  try {
    const conditions = [
      { type: "where", field: "active", operator: "==", value: true },
    ];
    return await getDocuments("staff", conditions);
  } catch (error) {
    console.error("Error getting staff:", error);
    throw error;
  }
};

export const updateStaff = async (staffId, staffData) => {
  try {
    await updateDocument("staff", staffId, staffData);
  } catch (error) {
    console.error("Error updating staff:", error);
    throw error;
  }
};

export const deleteStaff = async (staffId) => {
  try {
    await updateDocument("staff", staffId, { active: false });
  } catch (error) {
    console.error("Error deleting staff:", error);
    throw error;
  }
};

export const updateStaffStats = async (staffId) => {
  try {
    const staff = await getDocument("staff", staffId);
    if (staff) {
      await updateDocument("staff", staffId, {
        totalVisits: (staff.totalVisits || 0) + 1,
      });
    }
  } catch (error) {
    console.error("Error updating staff stats:", error);
    throw error;
  }
};

// ============================================
// SERVICE CATEGORY MANAGEMENT
// ============================================

export const getServiceCategories = async () => {
  try {
    const categories = await getDocuments("serviceCategories", [
      { type: "orderBy", field: "order", direction: "asc" },
    ]);
    return categories;
  } catch (error) {
    console.error("Error getting service categories:", error);
    throw error;
  }
};

export const addServiceCategory = async (categoryData) => {
  try {
    // Get current max order
    const categories = await getServiceCategories();
    const maxOrder =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.order || 0))
        : 0;

    const categoryId = await addDocument("serviceCategories", {
      name: categoryData.name,
      order: maxOrder + 1,
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return categoryId;
  } catch (error) {
    console.error("Error adding service category:", error);
    throw error;
  }
};

export const updateServiceCategory = async (categoryId, categoryData) => {
  try {
    await updateDocument("serviceCategories", categoryId, {
      ...categoryData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating service category:", error);
    throw error;
  }
};

export const deleteServiceCategory = async (categoryId) => {
  try {
    await deleteDocument("serviceCategories", categoryId);
  } catch (error) {
    console.error("Error deleting service category:", error);
    throw error;
  }
};

export const initializeDefaultCategories = async () => {
  try {
    const existingCategories = await getServiceCategories();
    if (existingCategories.length > 0) {
      return existingCategories;
    }

    const defaultCategories = [
      "Hair Services",
      "Barbering",
      "Spa & Massage",
      "Nail Services",
      "Facial & Skincare",
      "Makeup",
      "Waxing & Threading",
      "Eyelash Services",
      "Body Treatments",
      "Grooming",
      "Wellness",
      "Other",
    ];

    for (let i = 0; i < defaultCategories.length; i++) {
      await addDocument("serviceCategories", {
        name: defaultCategories[i],
        order: i + 1,
        isActive: true,
        createdAt: serverTimestamp(),
      });
    }

    return await getServiceCategories();
  } catch (error) {
    console.error("Error initializing default categories:", error);
    throw error;
  }
};

// ============================================
// SERVICE MANAGEMENT
// ============================================

export const addService = async (serviceData) => {
  try {
    const serviceId = await addDocument("services", {
      name: serviceData.name,
      category: serviceData.category || "",
      price: parseFloat(serviceData.price),
      duration: parseInt(serviceData.duration) || 30,
      gender: serviceData.gender || "any",
      description: serviceData.description || "",
      image: serviceData.image || "",
      deletedAt: null,
      createdAt: serverTimestamp(),
    });
    return serviceId;
  } catch (error) {
    console.error("Error adding service:", error);
    throw error;
  }
};

export const getServices = async (includeDeleted = false) => {
  try {
    const conditions = includeDeleted
      ? []
      : [{ type: "where", field: "deletedAt", operator: "==", value: null }];
    conditions.push({ type: "orderBy", field: "createdAt", direction: "desc" });
    return await getDocuments("services", conditions);
  } catch (error) {
    console.error("Error getting services:", error);
    throw error;
  }
};

export const getRecentServices = async (days = 7) => {
  try {
    const allServices = await getServices(true);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    return allServices.filter((service) => {
      const createdAt = service.createdAt?.toDate?.() || service.createdAt;
      return createdAt > pastDate;
    });
  } catch (error) {
    console.error("Error getting recent services:", error);
    throw error;
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    await updateDocument("services", serviceId, {
      ...serviceData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    await softDeleteDocument("services", serviceId);
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

export const restoreService = async (serviceId) => {
  try {
    await restoreDocument("services", serviceId);
  } catch (error) {
    console.error("Error restoring service:", error);
    throw error;
  }
};

// ============================================
// PRODUCT MANAGEMENT
// ============================================

export const addProduct = async (productData) => {
  try {
    const productId = await addDocument("products", {
      name: productData.name,
      category: productData.category || "",
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock) || 0,
      description: productData.description || "",
      imageUrl: productData.imageUrl || null,
    });
    return productId;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    return await getDocuments("products", [
      { type: "orderBy", field: "createdAt", direction: "desc" },
    ]);
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    await updateDocument("products", productId, productData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    await deleteDocument("products", productId);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

export const updateProductStock = async (productId, quantity) => {
  try {
    const product = await getDocument("products", productId);
    if (product) {
      await updateDocument("products", productId, {
        stock: (product.stock || 0) - quantity,
      });
    }
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw error;
  }
};

// ============================================
// VISIT MANAGEMENT
// ============================================

export const createVisit = async (visitData) => {
  try {
    console.log("📝 createVisit called with visitData:", visitData);

    // Handle both customer object and flat customerName/customerPhone structure
    let customerInfo = {
      name: "",
      phone: "",
      email: "",
    };

    if (visitData.customer) {
      // Customer is an object with id, name, contactNo/phone, email
      customerInfo = {
        name: visitData.customer.name || "",
        phone: visitData.customer.phone || visitData.customer.contactNo || "",
        email: visitData.customer.email || "",
      };
    } else {
      // Legacy flat structure
      customerInfo = {
        name: visitData.customerName || "",
        phone: visitData.customerPhone || "",
        email: visitData.customerEmail || "",
      };
    }

    const visitId = await addDocument("visits", {
      customerId: visitData.customerId,
      customer: customerInfo,
      staffId: visitData.staffId || "",
      date: Timestamp.now(),
      status: visitData.status || "CHECKED_IN",
      items: visitData.items || [],
      totalAmount: 0,
      paidAmount: 0,
      notes: visitData.notes || "",
      feedback: null,
      invoiceId: null,
      deletedAt: null,
      createdAt: serverTimestamp(),
    });
    return visitId;
  } catch (error) {
    console.error("Error creating visit:", error);
    throw error;
  }
};

export const getVisits = async (includeDeleted = false) => {
  try {
    const conditions = includeDeleted
      ? []
      : [{ type: "where", field: "deletedAt", operator: "==", value: null }];
    conditions.push({ type: "orderBy", field: "date", direction: "desc" });
    return await getDocuments("visits", conditions);
  } catch (error) {
    console.error("Error getting visits:", error);
    throw error;
  }
};

export const getActiveVisits = async () => {
  try {
    const allVisits = await getDocuments("visits", [
      { type: "where", field: "deletedAt", operator: "==", value: null },
      { type: "orderBy", field: "date", direction: "desc" },
    ]);
    console.log("📊 All visits from DB:", allVisits);

    // Include all non-deleted visits with active statuses
    const filtered = allVisits.filter(
      (visit) =>
        visit.status &&
        ["CHECKED_IN", "IN_SERVICE", "READY_FOR_BILLING", "COMPLETED"].includes(
          visit.status,
        ),
    );
    console.log("🔍 Filtered active visits:", filtered);
    return filtered;
  } catch (error) {
    console.error("Error getting active visits:", error);
    throw error;
  }
};

export const getVisitsByCustomer = async (customerId) => {
  try {
    return await getDocuments("visits", [
      { type: "where", field: "customerId", operator: "==", value: customerId },
      { type: "where", field: "deletedAt", operator: "==", value: null },
      { type: "orderBy", field: "date", direction: "desc" },
    ]);
  } catch (error) {
    console.error("Error getting customer visits:", error);
    throw error;
  }
};

export const calculateCustomerTotalSpent = async (customerId) => {
  try {
    // Get all visits for the customer
    const visits = await getVisitsByCustomer(customerId);

    // Calculate total from all invoices in visits
    const totalSpent = visits.reduce((sum, visit) => {
      const invoiceTotal = visit.invoice?.total || 0;
      return sum + invoiceTotal;
    }, 0);

    // Update customer's totalSpent field
    const customer = await getDocument("customers", customerId);
    if (customer) {
      await updateDocument("customers", customerId, {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
      });
    }

    return totalSpent;
  } catch (error) {
    console.error("Error calculating customer total spent:", error);
    throw error;
  }
};

export const addVisitItem = async (visitId, item) => {
  try {
    const visit = await getDocument("visits", visitId);
    if (visit) {
      const items = visit.items || [];
      const newItem = {
        id: Date.now().toString(),
        type: item.type || "service",
        name: item.name || "",
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
      };

      // Only add optional fields if they exist and are not undefined
      if (item.serviceId) newItem.serviceId = item.serviceId;
      if (item.productId) newItem.productId = item.productId;
      if (item.staff !== null && item.staff !== undefined)
        newItem.staff = item.staff;
      if (item.duration) newItem.duration = item.duration;

      items.push(newItem);

      const totalAmount = items.reduce(
        (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
        0,
      );

      // Only update with clean data
      const updateData = {
        items: items,
        totalAmount: totalAmount,
      };

      await updateDocument("visits", visitId, updateData);

      return newItem.id;
    }
  } catch (error) {
    console.error("Error adding visit item:", error);
    throw error;
  }
};

export const removeVisitItem = async (visitId, itemIndex) => {
  try {
    const visit = await getDocument("visits", visitId);
    if (visit && visit.items) {
      const items = visit.items.filter((_, index) => index !== itemIndex);
      const totalAmount = items.reduce(
        (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
        0,
      );

      await updateDocument("visits", visitId, {
        items: items,
        totalAmount: totalAmount,
      });
    }
  } catch (error) {
    console.error("Error removing visit item:", error);
    throw error;
  }
};

export const updateVisitStatus = async (visitId, status) => {
  try {
    await updateDocument("visits", visitId, { status: status });
  } catch (error) {
    console.error("Error updating visit status:", error);
    throw error;
  }
};

export const deleteVisit = async (visitId) => {
  try {
    await softDeleteDocument("visits", visitId);
  } catch (error) {
    console.error("Error deleting visit:", error);
    throw error;
  }
};

export const updateVisit = async (visitId, data) => {
  try {
    await updateDocument("visits", visitId, data);
  } catch (error) {
    console.error("Error updating visit:", error);
    throw error;
  }
};

export const assignStaffToService = async (visitId, serviceIndex, staffId) => {
  try {
    const visit = await getDocument("visits", visitId);
    if (visit && visit.items && visit.items[serviceIndex]) {
      // Update the specific item's staff assignment
      const items = [...visit.items];
      items[serviceIndex] = {
        ...items[serviceIndex],
        staff: staffId || null,
      };
      await updateDocument("visits", visitId, { items: items });
    } else {
      throw new Error("Visit or service item not found");
    }
  } catch (error) {
    console.error("Error assigning staff to service:", error);
    throw error;
  }
};

// ============================================
// INVOICE & BILLING
// ============================================

/**
 * Generate next invoice ID with VELVET prefix and sequential numbering
 * Format: VELVET00001, VELVET00002, etc.
 */
export const generateInvoiceId = async () => {
  try {
    const counterRef = doc(db, "counters", "invoiceCounter");

    const newId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let nextNumber = 1;
      if (counterDoc.exists()) {
        nextNumber = (counterDoc.data().count || 0) + 1;
      }

      // Update the counter
      transaction.set(counterRef, { count: nextNumber }, { merge: true });

      // Return formatted invoice ID with 4 padding zeros for format VELVET0001
      return `VELVET${String(nextNumber).padStart(4, "0")}`;
    });

    return newId;
  } catch (error) {
    console.error("Error generating invoice ID:", error);
    throw error;
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    // invoiceData contains: customerId, customerName, customerPhone, customerEmail,
    // items, totalAmount, paidAmount, discountPercent, taxPercent, paymentMode, status, notes, staffId, invoiceDate, visitId

    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      items,
      totalAmount,
      paidAmount,
      discountPercent = 0,
      discountAmount = 0,
      discountType = "none",
      pointsUsed = 0,
      pointsDiscount = 0,
      pointsEarned = 0,
      taxPercent = 18,
      paymentMode,
      status,
      notes,
      staffId,
      invoiceDate,
      visitId,
      subtotal = 0,
    } = invoiceData;

    // Use provided invoice ID (from CheckoutModal) or generate a new one
    const invoiceId = invoiceData.invoiceId || (await generateInvoiceId());

    // Calculate net amount after discount
    const calculatedDiscount =
      discountAmount || (totalAmount * discountPercent) / 100;

    // Subtotal should be the sum of items before discount
    const calculatedSubtotal =
      subtotal || parseFloat(totalAmount) + parseFloat(calculatedDiscount);

    // finalAmount should match what the user saw on checkout screen
    const finalAmount =
      parseFloat(totalAmount) || calculatedSubtotal - calculatedDiscount;

    // Build invoice object, filtering out undefined values
    const invoiceObj = {
      invoiceId: invoiceId, // Custom formatted ID
      visitId: visitId || null,
      customerId: customerId || null,
      staffId: staffId || null,
      customerName: customerName || "Unknown",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      items: items || [],
      totalAmount: finalAmount || 0,
      discountPercent: discountPercent || 0,
      discountAmount: calculatedDiscount || 0,
      discountType: discountType || "none",
      pointsUsed: pointsUsed || 0,
      pointsDiscount: pointsDiscount || 0,
      pointsEarned: pointsEarned || 0,
      taxPercent: 0,
      taxAmount: 0,
      subtotal: calculatedSubtotal || 0,
      finalAmount: finalAmount || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      paymentMode: paymentMode || "cash",
      status: status || "unpaid",
      notes: notes || "",
      invoiceDate: invoiceDate || serverTimestamp(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: serverTimestamp(),
    };

    // Remove any remaining undefined values
    Object.keys(invoiceObj).forEach((key) => {
      if (invoiceObj[key] === undefined) {
        delete invoiceObj[key];
      }
    });

    // Use setDoc with custom invoiceId as the document ID
    const invoiceRef = doc(db, "invoices", invoiceId);
    await setDoc(invoiceRef, invoiceObj);

    // Link invoice to visit
    if (visitId) {
      await updateDocument("visits", visitId, { invoiceId: invoiceId });
    }

    // Add loyalty points if payment is made and customer exists
    // NOTE: Loyalty points are now handled directly in CheckoutModal payment flow
    // This comment prevents duplicate pointsHistory entries
    /*
    if (customerId && paidAmount > 0) {
      const loyaltyPoints = Math.floor(paidAmount); // 1 point per rupee paid
      const billDetails = {
        invoiceId: invoiceId,
        items: items,
        subtotal: subtotal,
        discountAmount: discountAmount,
        taxAmount: taxAmount,
        total: finalAmount,
        paidAmount: parseFloat(paidAmount),
        paymentMode: paymentMode,
        status: status,
        invoiceDate: invoiceDate || new Date(),
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        notes: notes
      };
      
      await addLoyaltyPoints(
        customerId,
        loyaltyPoints,
        parseFloat(paidAmount),
        invoiceId,
        billDetails,
        `Points earned from invoice #${invoiceId}`
      );
    }
    */

    return invoiceId;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

export const getInvoices = async () => {
  try {
    return await getDocuments("invoices", [
      { type: "orderBy", field: "invoiceDate", direction: "desc" },
    ]);
  } catch (error) {
    console.error("Error getting invoices:", error);
    throw error;
  }
};

export const getInvoice = async (invoiceId) => {
  try {
    return await getDocument("invoices", invoiceId);
  } catch (error) {
    console.error("Error getting invoice:", error);
    throw error;
  }
};

export const payInvoice = async (invoiceId, amount) => {
  try {
    const invoice = await getDocument("invoices", invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const newPaidAmount = (invoice.paidAmount || 0) + parseFloat(amount);
    const status = newPaidAmount >= invoice.totalAmount ? "paid" : "partial";

    await updateDocument("invoices", invoiceId, {
      paidAmount: newPaidAmount,
      status: status,
    });

    // Record payment
    const paymentId = await addDocument("payments", {
      invoiceId: invoiceId,
      amount: parseFloat(amount),
      paymentDate: serverTimestamp(),
      paymentMethod: "cash",
      notes: "",
    });

    // Update customer stats
    if (invoice.customerId) {
      await updateCustomerStats(invoice.customerId, parseFloat(amount));
    }

    return paymentId;
  } catch (error) {
    console.error("Error paying invoice:", error);
    throw error;
  }
};

// ============================================
// FEEDBACK
// ============================================

export const submitFeedback = async (visitId, feedbackData) => {
  try {
    const feedbackId = await addDocument("feedback", {
      visitId: visitId,
      customerId: feedbackData.customerId,
      rating: parseInt(feedbackData.rating),
      comment: feedbackData.comment || "",
      feedbackDate: serverTimestamp(),
    });

    // Update visit with feedback reference
    await updateDocument("visits", visitId, { feedback: feedbackId });

    return feedbackId;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

// ============================================
// DASHBOARD & STATISTICS
// ============================================

export const getDashboardStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    // Get all invoices
    const invoices = await getDocuments("invoices", []);

    // Get visits from today
    const allVisits = await getVisits(false);
    const todayVisits = allVisits.filter((v) => {
      const visitDate = v.date?.toDate?.() || v.date;
      return visitDate >= today;
    });

    // Calculate daily sales
    const dailySales = invoices
      .filter((inv) => {
        const invDate = inv.invoiceDate?.toDate?.() || inv.invoiceDate;
        return invDate >= today;
      })
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Calculate monthly sales
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlySales = invoices
      .filter((inv) => {
        const invDate = inv.invoiceDate?.toDate?.() || inv.invoiceDate;
        return invDate >= thisMonth;
      })
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Get top services
    const allServiceData = {};
    invoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        if (item.type === "service") {
          if (!allServiceData[item.name]) {
            allServiceData[item.name] = {
              name: item.name,
              count: 0,
              revenue: 0,
            };
          }
          allServiceData[item.name].count += item.quantity;
          allServiceData[item.name].revenue += item.price * item.quantity;
        }
      });
    });

    const topServices = Object.values(allServiceData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get top products
    const allProductData = {};
    invoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        if (item.type === "product") {
          if (!allProductData[item.name]) {
            allProductData[item.name] = {
              name: item.name,
              count: 0,
              revenue: 0,
            };
          }
          allProductData[item.name].count += item.quantity;
          allProductData[item.name].revenue += item.price * item.quantity;
        }
      });
    });

    const topProducts = Object.values(allProductData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get monthly trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthSales = invoices
        .filter((inv) => {
          const invDate = inv.invoiceDate?.toDate?.() || inv.invoiceDate;
          return invDate >= monthStart && invDate < monthEnd;
        })
        .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        sales: monthSales,
      });
    }

    // Get recent transactions
    const recentTransactions = invoices
      .sort(
        (a, b) =>
          (b.invoiceDate?.toDate?.() || b.invoiceDate) -
          (a.invoiceDate?.toDate?.() || a.invoiceDate),
      )
      .slice(0, 10)
      .map((inv) => ({
        id: inv.id,
        customer: inv.customerName,
        amount: inv.totalAmount,
        paid: inv.paidAmount,
        status: inv.status,
        date: inv.invoiceDate,
      }));

    return {
      dailySales,
      monthlySales,
      todayVisits: todayVisits.length,
      totalInvoices: invoices.length,
      topServices,
      topProducts,
      monthlyTrend,
      recentTransactions,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

export const getSalesStats = async () => {
  try {
    const invoices = await getDocuments("invoices", []);

    const totalSales = invoices.reduce(
      (sum, inv) => sum + (inv.paidAmount || 0),
      0,
    );
    const totalOrders = invoices.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;
    const pendingAmount = invoices.reduce(
      (sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)),
      0,
    );

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      paidInvoices,
      pendingAmount,
    };
  } catch (error) {
    console.error("Error getting sales stats:", error);
    throw error;
  }
};

export const uploadProductImage = async (file) => {
  try {
    if (!file) throw new Error("No file provided");

    const fileName = `admin/products/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, fileName);

    // Upload file
    await uploadBytes(fileRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadServiceImage = async (file) => {
  try {
    if (!file) throw new Error("No file provided");

    const fileName = `admin/services/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, fileName);

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading service image:", error);
    throw error;
  }
};

// ============================================
// LOYALTY & POINTS SYSTEM
// ============================================

export const addCustomerPoints = async (customerId, points, reason = "") => {
  try {
    // Create points transaction
    const transactionId = await addDocument("pointsTransactions", {
      customerId: customerId,
      points: points,
      reason: reason,
      transactionDate: serverTimestamp(),
      type: points > 0 ? "earned" : "redeemed",
    });

    // Update customer total points
    const customer = await getDocument("customers", customerId);
    const currentPoints = customer.loyaltyPoints || 0;
    await updateDocument("customers", customerId, {
      loyaltyPoints: Math.max(0, currentPoints + points),
    });

    return transactionId;
  } catch (error) {
    console.error("Error adding customer points:", error);
    throw error;
  }
};

export const redeemCustomerPoints = async (customerId, pointsToRedeem) => {
  try {
    const customer = await getDocument("customers", customerId);
    const availablePoints = customer.loyaltyPoints || 0;

    if (availablePoints < pointsToRedeem) {
      throw new Error("Insufficient points");
    }

    await addCustomerPoints(
      customerId,
      -pointsToRedeem,
      "Redeemed for discount",
    );
    return true;
  } catch (error) {
    console.error("Error redeeming points:", error);
    throw error;
  }
};

export const getCustomerLoyaltyInfo = async (customerId) => {
  try {
    const customer = await getDocument("customers", customerId);
    const transactions = await getDocuments("pointsTransactions", [
      { type: "where", field: "customerId", operator: "==", value: customerId },
      { type: "orderBy", field: "transactionDate", direction: "desc" },
    ]);

    return {
      customerId: customerId,
      totalPoints: customer.loyaltyPoints || 0,
      totalVisits: customer.totalVisits || 0,
      totalSpent: customer.totalSpent || 0,
      transactions: transactions.slice(0, 20),
    };
  } catch (error) {
    console.error("Error getting customer loyalty info:", error);
    throw error;
  }
};

// ============================================
// STAFF ATTENDANCE & COMMISSION
// ============================================

export const getTodayPunchStatus = async (staffId, staffName) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    const staffData = await getDocument("staffAttendance", staffName);
    if (!staffData) {
      return { hasPunchedIn: false, hasPunchedOut: false, record: null };
    }

    const todayRecord = staffData[dateStr];
    if (!todayRecord) {
      return { hasPunchedIn: false, hasPunchedOut: false, record: null };
    }

    return {
      hasPunchedIn: !!todayRecord.punchInTime,
      hasPunchedOut: !!todayRecord.punchOutTime,
      record: { ...todayRecord, dateStr, staffName, staffId },
      dateStr,
    };
  } catch (error) {
    console.error("Error getting punch status:", error);
    throw error;
  }
};

export const punchInStaff = async (staffId, staffName) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Get existing staff document or create structure
    let staffData = await getDocument("staffAttendance", staffName);
    if (!staffData) {
      staffData = { staffId, createdAt: Timestamp.now() };
    }

    // Check if already punched in today
    if (staffData[dateStr] && staffData[dateStr].punchInTime) {
      console.warn("Staff already punched in today");
      throw new Error(
        "You have already punched in today. Use punch out or edit the record if needed.",
      );
    }

    // Create punch-in record for today
    const now = Timestamp.now();
    staffData[dateStr] = {
      staffId: staffId,
      punchInTime: now,
      punchOutTime: null,
      workHours: 0,
      status: "present",
    };

    // Save/update the staff document using setDoc with merge to ensure creation if not exists
    const docRef = doc(db, "staffAttendance", staffName);
    await setDoc(docRef, staffData, { merge: true });

    console.log("Punch in successful for", staffName, "on", dateStr);
    return dateStr;
  } catch (error) {
    console.error("Error punching in:", error);
    throw error;
  }
};

export const punchOutStaff = async (staffId, staffName) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    const staffData = await getDocument("staffAttendance", staffName);
    if (!staffData || !staffData[dateStr] || !staffData[dateStr].punchInTime) {
      throw new Error("No punch-in record found for today");
    }

    const todayRecord = staffData[dateStr];
    const punchInTime =
      todayRecord.punchInTime?.toDate?.() || new Date(todayRecord.punchInTime);
    const punchOutTime = new Date();
    const workHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);

    // Update the punch-out time and work hours
    staffData[dateStr] = {
      ...staffData[dateStr],
      punchOutTime: Timestamp.now(),
      workHours: parseFloat(workHours.toFixed(2)),
      status: "present",
    };

    // Use setDoc with merge to ensure creation if not exists
    const docRef = doc(db, "staffAttendance", staffName);
    await setDoc(docRef, staffData, { merge: true });

    console.log("Punch out successful for", staffName, "on", dateStr);
    return dateStr;
  } catch (error) {
    console.error("Error punching out:", error);
    throw error;
  }
};

export const getStaffAttendance = async (
  staffName,
  month = new Date(),
  staffId = null,
) => {
  try {
    // Parse month - can be Date object or string (YYYY-MM)
    let year, monthNum;

    if (typeof month === "string") {
      const parts = month.split("-");
      year = parseInt(parts[0], 10);
      monthNum = parseInt(parts[1], 10) - 1; // 0-indexed
    } else {
      year = month.getFullYear();
      monthNum = month.getMonth();
    }

    const monthStart = new Date(year, monthNum, 1);
    const monthEnd = new Date(year, monthNum + 1, 0);
    const monthPrefix = `${year}-${String(monthNum + 1).padStart(2, "0")}`;

    const staffData = await getDocument("staffAttendance", staffName);
    if (!staffData) return [];

    // Filter records by month and convert to array format
    const records = [];
    for (const [dateStr, record] of Object.entries(staffData)) {
      if (dateStr.startsWith(monthPrefix) && dateStr !== "staffId") {
        records.push({
          id: dateStr, // Use dateStr as ID for consistency
          ...record,
          dateStr,
          staffName,
          date: new Date(dateStr), // For sorting
          formattedDate: new Date(dateStr).toLocaleDateString(),
        });
      }
    }

    // Sort by date (newest first)
    return records.sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
  } catch (error) {
    console.error("Error getting staff attendance:", error);
    throw error;
  }
};

export const calculateStaffCommission = async (staffId, month = new Date()) => {
  try {
    // Parse month - can be Date object or string (YYYY-MM)
    let year, monthNum;

    if (typeof month === "string") {
      const parts = month.split("-");
      year = parseInt(parts[0], 10);
      monthNum = parseInt(parts[1], 10) - 1; // 0-indexed
    } else {
      year = month.getFullYear();
      monthNum = month.getMonth();
    }

    const monthStart = new Date(year, monthNum, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(year, monthNum + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const staff = await getDocument("staff", staffId);
    if (!staff) throw new Error("Staff not found");

    // Get all invoices where this staff member provided service
    const allInvoices = await getDocuments("invoices", []);

    // Filter invoices for this staff and month by staffId field
    const filteredInvoices = [];

    for (const invoice of allInvoices) {
      const invDate = invoice.invoiceDate?.toDate?.() || invoice.invoiceDate;
      if (invDate >= monthStart && invDate <= monthEnd) {
        // Check if staffId matches (new field) OR get from visit (legacy)
        if (invoice.staffId === staffId) {
          filteredInvoices.push(invoice);
        } else if (!invoice.staffId && invoice.visitId) {
          // Fallback for old invoices without staffId field
          const visit = await getDocument("visits", invoice.visitId);
          if (visit && visit.staffId === staffId) {
            filteredInvoices.push(invoice);
          }
        }
      }
    }

    // Use totalAmount (service price) for commission calculation, not paidAmount
    const totalServiceAmount = filteredInvoices.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0,
    );
    const commissionPercent = 0.1; // 10% commission
    const totalCommission = totalServiceAmount * commissionPercent;

    return {
      staffId: staffId,
      staffName: staff.name,
      month: monthStart.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      totalServiceAmount: totalServiceAmount,
      commissionPercent: commissionPercent * 100,
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      invoiceCount: filteredInvoices.length,
      paidAmount: filteredInvoices.reduce(
        (sum, inv) => sum + (inv.paidAmount || 0),
        0,
      ),
    };
  } catch (error) {
    console.error("Error calculating commission:", error);
    throw error;
  }
};

export const deleteAttendanceRecord = async (staffName, dateStr) => {
  try {
    console.log("deleteAttendanceRecord called with:", { staffName, dateStr });

    const staffData = await getDocument("staffAttendance", staffName);
    console.log("Current staff data:", staffData);

    if (!staffData) {
      throw new Error("Staff record not found in database");
    }

    if (!staffData[dateStr]) {
      throw new Error(`Attendance record not found for date: ${dateStr}`);
    }

    // Use updateDoc with deleteField to properly remove the field from Firestore
    const docRef = doc(db, "staffAttendance", staffName);
    await updateDoc(docRef, {
      [dateStr]: deleteField(),
    });

    console.log(
      "Attendance record deleted successfully for",
      staffName,
      "on",
      dateStr,
    );
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    throw new Error(`Failed to delete record: ${error.message}`);
  }
};

export const updateAttendanceRecord = async (staffName, dateStr, updates) => {
  try {
    const staffData = await getDocument("staffAttendance", staffName);
    if (staffData && staffData[dateStr]) {
      staffData[dateStr] = { ...staffData[dateStr], ...updates };
      // Use setDoc with merge to ensure proper update
      const docRef = doc(db, "staffAttendance", staffName);
      await setDoc(docRef, staffData, { merge: true });
      console.log("Attendance record updated for", staffName, "on", dateStr);
    } else {
      throw new Error("Attendance record not found");
    }
  } catch (error) {
    console.error("Error updating attendance record:", error);
    throw error;
  }
};

export const recordStaffCommission = async (staffId, amount, month) => {
  try {
    const commissionId = await addDocument("staffCommissions", {
      staffId: staffId,
      amount: parseFloat(amount),
      month: month,
      paymentDate: null,
      status: "pending",
      recordedDate: serverTimestamp(),
    });

    return commissionId;
  } catch (error) {
    console.error("Error recording commission:", error);
    throw error;
  }
};

export const getStaffCommissionHistory = async (staffId) => {
  try {
    const commissions = await getDocuments("staffCommissions", [
      { type: "where", field: "staffId", operator: "==", value: staffId },
      { type: "orderBy", field: "recordedDate", direction: "desc" },
    ]);
    return commissions;
  } catch (error) {
    console.error("Error getting commission history:", error);
    throw error;
  }
};

export const payCommission = async (commissionId, paymentAmount) => {
  try {
    const commission = await getDocument("staffCommissions", commissionId);
    if (!commission) throw new Error("Commission record not found");

    await updateDocument("staffCommissions", commissionId, {
      paymentDate: serverTimestamp(),
      status: "paid",
      paidAmount: parseFloat(paymentAmount),
    });

    return true;
  } catch (error) {
    console.error("Error paying commission:", error);
    throw error;
  }
};

export const getStaffCommissionByMonth = async (staffId, month) => {
  try {
    const allCommissions = await getStaffCommissionHistory(staffId);
    const filtered = allCommissions.filter((comm) => comm.month === month);
    return filtered.length > 0 ? filtered[0] : null;
  } catch (error) {
    console.error("Error getting commission by month:", error);
    throw error;
  }
};

// ============================================
// ATTENDANCE ANALYTICS & REPORTING
// ============================================

export const getAttendanceStats = async (staffName, month) => {
  try {
    let year, monthNum;
    if (typeof month === "string") {
      const parts = month.split("-");
      year = parseInt(parts[0], 10);
      monthNum = parseInt(parts[1], 10) - 1;
    } else {
      year = month.getFullYear();
      monthNum = month.getMonth();
    }

    const monthPrefix = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
    const staffData = await getDocument("staffAttendance", staffName);
    if (!staffData) return null;

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalWorkHours = 0;
    let lateArrivals = 0;
    const SHIFT_START_HOUR = 10; // 10 AM

    for (const [dateStr, record] of Object.entries(staffData)) {
      if (
        dateStr.startsWith(monthPrefix) &&
        dateStr !== "staffId" &&
        dateStr !== "createdAt"
      ) {
        if (record.status === "present") totalPresent++;
        if (record.status === "absent") totalAbsent++;
        if (record.workHours) totalWorkHours += record.workHours;

        // Check for late arrival
        if (record.punchInTime) {
          const punchInDate =
            record.punchInTime?.toDate?.() || new Date(record.punchInTime);
          if (punchInDate.getHours() > SHIFT_START_HOUR) lateArrivals++;
        }
      }
    }

    const totalDaysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const attendancePercentage =
      totalDaysInMonth > 0
        ? ((totalPresent / totalDaysInMonth) * 100).toFixed(2)
        : 0;

    return {
      staffName,
      month: monthPrefix,
      totalPresent,
      totalAbsent,
      totalDaysInMonth,
      attendancePercentage: parseFloat(attendancePercentage),
      totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
      averageWorkHoursPerDay:
        totalPresent > 0
          ? parseFloat((totalWorkHours / totalPresent).toFixed(2))
          : 0,
      lateArrivals,
    };
  } catch (error) {
    console.error("Error getting attendance stats:", error);
    throw error;
  }
};

export const getAllStaffAttendanceStats = async (staffList, month) => {
  try {
    const statsPromises = staffList.map((staff) =>
      getAttendanceStats(staff.name, month),
    );
    const allStats = await Promise.all(statsPromises);
    return allStats.filter((stat) => stat !== null);
  } catch (error) {
    console.error("Error getting all staff stats:", error);
    throw error;
  }
};

export const markAttendanceManual = async (
  staffId,
  staffName,
  date,
  punchInTime,
  punchOutTime,
  status = "present",
) => {
  try {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];

    let staffData = await getDocument("staffAttendance", staffName);
    if (!staffData) {
      staffData = { staffId, createdAt: Timestamp.now() };
    }

    // Only calculate work hours and save punch times for present/half-day
    let recordData = {
      staffId: staffId,
      status: status,
      manuallyAdded: true,
      addedAt: Timestamp.now(),
    };

    if (
      punchInTime &&
      punchOutTime &&
      ["present", "half-day"].includes(status)
    ) {
      const punchInDate =
        typeof punchInTime === "string" ? new Date(punchInTime) : punchInTime;
      const punchOutDate =
        typeof punchOutTime === "string"
          ? new Date(punchOutTime)
          : punchOutTime;
      const workHours = (punchOutDate - punchInDate) / (1000 * 60 * 60);

      recordData.punchInTime = Timestamp.fromDate(punchInDate);
      recordData.punchOutTime = Timestamp.fromDate(punchOutDate);
      recordData.workHours = parseFloat(workHours.toFixed(2));
    } else if (status === "absent" || status === "leave") {
      // For absent/leave, set work hours to 0 and don't include punch times
      recordData.workHours = 0;
    }

    staffData[dateStr] = recordData;

    const docRef = doc(db, "staffAttendance", staffName);
    await setDoc(docRef, staffData, { merge: true });
    console.log(
      "Attendance manually marked for",
      staffName,
      "on",
      dateStr,
      "with status:",
      status,
    );
    return dateStr;
  } catch (error) {
    console.error("Error marking attendance manually:", error);
    throw error;
  }
};

export const bulkMarkAttendance = async (
  staffMembers,
  date,
  status = "present",
) => {
  try {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    const results = [];

    for (const staff of staffMembers) {
      let staffData = await getDocument("staffAttendance", staff.name);
      if (!staffData) {
        staffData = { staffId: staff.id, createdAt: Timestamp.now() };
      }

      staffData[dateStr] = {
        staffId: staff.id,
        status: status,
        markedAt: Timestamp.now(),
      };

      const docRef = doc(db, "staffAttendance", staff.name);
      await setDoc(docRef, staffData, { merge: true });
      results.push({ staffName: staff.name, status: "success" });
    }

    return results;
  } catch (error) {
    console.error("Error in bulk marking attendance:", error);
    throw error;
  }
};

export const getMonthlyAttendanceReport = async (staffName, month) => {
  try {
    let year, monthNum;
    if (typeof month === "string") {
      const parts = month.split("-");
      year = parseInt(parts[0], 10);
      monthNum = parseInt(parts[1], 10) - 1;
    } else {
      year = month.getFullYear();
      monthNum = month.getMonth();
    }

    const monthPrefix = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
    const staffData = await getDocument("staffAttendance", staffName);
    if (!staffData) return [];

    const report = [];
    for (const [dateStr, record] of Object.entries(staffData)) {
      if (
        dateStr.startsWith(monthPrefix) &&
        dateStr !== "staffId" &&
        dateStr !== "createdAt"
      ) {
        const punchInTime =
          record.punchInTime?.toDate?.() ||
          (record.punchInTime ? new Date(record.punchInTime) : null);
        const punchOutTime =
          record.punchOutTime?.toDate?.() ||
          (record.punchOutTime ? new Date(record.punchOutTime) : null);

        report.push({
          date: dateStr,
          dayName: new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          punchInTime: punchInTime?.toLocaleTimeString() || "-",
          punchOutTime: punchOutTime?.toLocaleTimeString() || "-",
          workHours: record.workHours || 0,
          status: record.status || "N/A",
        });
      }
    }

    return report.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error getting monthly report:", error);
    throw error;
  }
};

// ============================================
// APPOINTMENT SCHEDULING
// ============================================

export const createAppointment = async (appointmentData) => {
  try {
    const appointmentId = await addDocument("appointments", {
      customerId: appointmentData.customerId,
      customerName: appointmentData.customerName,
      customerPhone: appointmentData.customerPhone,
      customerEmail: appointmentData.customerEmail,
      serviceId: appointmentData.serviceId,
      serviceName: appointmentData.serviceName,
      staffId: appointmentData.staffId || null,
      appointmentDate: Timestamp.fromDate(
        new Date(appointmentData.appointmentDate),
      ),
      appointmentTime: appointmentData.appointmentTime,
      duration: appointmentData.duration || 30,
      status: "scheduled",
      notes: appointmentData.notes || "",
      reminderSent: false,
      createdDate: serverTimestamp(),
    });

    return appointmentId;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

export const getAppointments = async (staffId = null) => {
  try {
    let conditions = [
      { type: "where", field: "status", operator: "!=", value: "cancelled" },
      { type: "orderBy", field: "appointmentDate", direction: "asc" },
    ];

    if (staffId) {
      conditions = [
        { type: "where", field: "staffId", operator: "==", value: staffId },
        { type: "where", field: "status", operator: "!=", value: "cancelled" },
        { type: "orderBy", field: "appointmentDate", direction: "asc" },
      ];
    }

    return await getDocuments("appointments", conditions);
  } catch (error) {
    console.error("Error getting appointments:", error);
    throw error;
  }
};

// Get all frontend bookings from appointments/{date}/bookings subcollections (use collectionGroup for reliability)
export const getFrontendBookings = async (includeAll = false) => {
  try {
    const bookings = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let q;
    if (includeAll) {
      // Fetch all bookings (for appointments management page)
      q = query(collectionGroup(db, "bookings"));
    } else {
      // Query all 'bookings' subcollections for appointmentDate >= today
      q = query(
        collectionGroup(db, "bookings"),
        where("appointmentDate", ">=", Timestamp.fromDate(today)),
      );
    }

    const snapshot = await getDocs(q);
    console.log(
      "getFrontendBookings - collectionGroup fetched",
      snapshot.size,
      "booking(s)",
    );

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("📅 RAW Booking data from Firestore:", data);
      console.log("📅 Booking data keys:", Object.keys(data));
      const aptDate =
        data.appointmentDate?.toDate?.() || new Date(data.appointmentDate);
      const booking = {
        id: doc.id,
        dateFolder: doc.ref.parent.parent ? doc.ref.parent.parent.id : null,
        ...data,
        source: "frontend",
        appointmentDate: aptDate,
      };
      console.log("📅 Final booking object:", booking);
      bookings.push(booking);
    });

    return bookings.sort(
      (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
    );
  } catch (error) {
    console.error("Error getting frontend bookings:", error);
    return [];
  }
};

// Get combined appointments (both admin-created and frontend bookings)
export const getAllAppointments = async (staffId = null) => {
  try {
    const [adminAppointments, frontendBookings] = await Promise.all([
      getAppointments(staffId),
      getFrontendBookings(),
    ]);

    let combined = [...adminAppointments, ...frontendBookings];

    if (staffId) {
      combined = combined.filter(
        (apt) => apt.stylistId === staffId || apt.staffId === staffId,
      );
    }

    return combined.sort((a, b) => {
      const dateA =
        a.appointmentDate?.toDate?.() || new Date(a.appointmentDate);
      const dateB =
        b.appointmentDate?.toDate?.() || new Date(b.appointmentDate);
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Error getting all appointments:", error);
    return [];
  }
};

export const getUpcomingAppointments = async (days = 7) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const allAppointments = await getAppointments();
    return allAppointments.filter((apt) => {
      const aptDate = apt.appointmentDate?.toDate?.() || apt.appointmentDate;
      return (
        aptDate >= now && aptDate <= futureDate && apt.status !== "completed"
      );
    });
  } catch (error) {
    console.error("Error getting upcoming appointments:", error);
    throw error;
  }
};

export const updateAppointmentStatus = async (
  dateFolder,
  appointmentId,
  status,
) => {
  try {
    // Handle date-wise folder structure: appointments/{dateFolder}/bookings/{appointmentId}
    if (dateFolder) {
      await updateDoc(
        doc(db, `appointments/${dateFolder}/bookings/${appointmentId}`),
        {
          status: status,
          updatedAt: serverTimestamp(),
        },
      );
    } else {
      // Fallback for old structure
      await updateDocument("appointments", appointmentId, { status: status });
    }
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId) => {
  try {
    await updateDocument("appointments", appointmentId, {
      status: "cancelled",
      cancelledDate: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw error;
  }
};

// Create a manual appointment in the date-wise folder structure
export const addManualAppointment = async (appointmentData) => {
  try {
    // Ensure we have a customer (create if needed)
    let customerId = appointmentData.customerId;

    if (!customerId) {
      // Try to find existing customer
      const existingCustomers = await searchCustomers(
        appointmentData.customerPhone,
      );
      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        // Create new customer
        customerId = await addCustomer({
          name: appointmentData.customerName,
          contactNo: appointmentData.customerPhone,
          email: appointmentData.customerEmail || "",
          gender: appointmentData.gender || "",
        });
      }
    }

    // Format appointment date
    const aptDate =
      appointmentData.appointmentDate instanceof Date
        ? appointmentData.appointmentDate
        : new Date(appointmentData.appointmentDate);

    // Create date folder format: YYYY-MM-DD
    const dateFolder = aptDate.toISOString().split("T")[0];

    // Prepare booking data
    const bookingData = {
      customerId: customerId,
      customerName: appointmentData.customerName || "",
      customerPhone: appointmentData.customerPhone || "",
      customerEmail: appointmentData.customerEmail || "",
      serviceId: appointmentData.serviceId || null,
      serviceName: appointmentData.serviceName || "Service not specified",
      stylistId: appointmentData.stylistId || null,
      stylistName: appointmentData.stylistName || "Any Stylist",
      appointmentDate: Timestamp.fromDate(aptDate),
      appointmentTime: appointmentData.appointmentTime || "10:00",
      duration: appointmentData.duration || 30,
      status: appointmentData.status || "pending",
      notes: appointmentData.notes || "",
      isManualBooking: true,
      createdAt: serverTimestamp(),
      createdBy: "admin",
    };

    // Create booking in appointments/{dateFolder}/bookings/{appointmentId}
    const bookingRef = collection(db, `appointments/${dateFolder}/bookings`);
    const docRef = await addDoc(bookingRef, bookingData);

    return {
      appointmentId: docRef.id,
      dateFolder: dateFolder,
      customerId: customerId,
      message: "Manual appointment added successfully!",
    };
  } catch (error) {
    console.error("Error adding manual appointment:", error);
    throw error;
  }
};

// Check in an appointment directly to visit/reception
export const checkInAppointment = async (appointment) => {
  try {
    // Get customer data from appointment
    const customerName = appointment.customerName || "";
    const customerPhone =
      appointment.customerPhone || appointment.customerId || "";
    const customerEmail = appointment.customerEmail || "";

    // Normalize the phone number
    const normalizedPhone = normalizePhone(customerPhone);

    // Create visit document by copying appointment details
    const visitData = {
      // Copy all appointment data
      appointmentId: appointment.id,
      customerId: normalizedPhone || appointment.customerId || "",
      customerName: customerName,
      customerPhone: normalizedPhone,
      customerEmail: customerEmail,
      customer: {
        name: customerName,
        phone: normalizedPhone,
        email: customerEmail,
        contactNo: normalizedPhone,
      },
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      stylistId: appointment.stylistId,
      stylistName: appointment.stylistName,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      notes: appointment.notes || "",

      // Visit specific fields
      status: "CHECKED_IN",
      date: Timestamp.now(),
      items: [],
      totalAmount: 0,
      paidAmount: 0,
      feedback: null,
      invoiceId: null,
      deletedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Create visit document
    const visitId = await addDocument("visits", visitData);

    // Update appointment status to checked-in
    if (appointment.dateFolder && appointment.id) {
      await updateDoc(
        doc(
          db,
          `appointments/${appointment.dateFolder}/bookings/${appointment.id}`,
        ),
        {
          status: "checked-in",
          visitId: visitId,
          checkedInAt: serverTimestamp(),
        },
      );
    }

    return { visitId, customerId: normalizedPhone };
  } catch (error) {
    console.error("Error checking in appointment:", error);
    throw error;
  }
};

// Cancel a frontend booking
export const cancelFrontendBooking = async (booking) => {
  try {
    if (!booking.dateFolder) {
      throw new Error("Missing date folder information");
    }

    await updateDoc(
      doc(db, `appointments/${booking.dateFolder}/bookings/${booking.id}`),
      {
        status: "cancelled",
        cancelledAt: serverTimestamp(),
      },
    );

    return true;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

export const getAvailableTimeSlots = async (
  serviceId,
  appointmentDate,
  staffId = null,
) => {
  try {
    const service = await getDocument("services", serviceId);
    if (!service) throw new Error("Service not found");

    const serviceDuration = service.duration || 30;
    const workStart = 10; // 10 AM
    const workEnd = 19; // 7 PM
    const timeSlots = [];

    const appointments = await getAppointments(staffId);
    const dayAppointments = appointments.filter((apt) => {
      const aptDate = apt.appointmentDate?.toDate?.() || apt.appointmentDate;
      const compareDate = new Date(appointmentDate);
      return aptDate.toDateString() === compareDate.toDateString();
    });

    for (let hour = workStart; hour < workEnd; hour++) {
      const time = `${String(hour).padStart(2, "0")}:00`;
      const isBooked = dayAppointments.some(
        (apt) => apt.appointmentTime === time,
      );

      if (!isBooked) {
        timeSlots.push({
          time: time,
          available: true,
        });
      }
    }

    return timeSlots;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    throw error;
  }
};

// ============================================
// ONLINE BOOKING PORTAL
// ============================================

export const getPublicServices = async () => {
  try {
    return await getServices(false);
  } catch (error) {
    console.error("Error getting public services:", error);
    throw error;
  }
};

export const bookAppointmentPublic = async (bookingData) => {
  try {
    // Check if customer exists
    const existingCustomers = await searchCustomers(bookingData.customerPhone);
    let customerId = null;

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      // Create new customer
      customerId = await addCustomer({
        name: bookingData.customerName,
        contactNo: bookingData.customerPhone,
        email: bookingData.customerEmail,
        gender: bookingData.gender || "",
      });
    }

    // Create appointment
    const appointmentId = await createAppointment({
      customerId: customerId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      customerEmail: bookingData.customerEmail,
      serviceId: bookingData.serviceId,
      serviceName: bookingData.serviceName,
      appointmentDate: bookingData.appointmentDate,
      appointmentTime: bookingData.appointmentTime,
      duration: bookingData.duration || 30,
      notes: bookingData.notes || "",
    });

    return {
      appointmentId: appointmentId,
      customerId: customerId,
      message:
        "Appointment booked successfully! You will receive confirmation via SMS/Email.",
    };
  } catch (error) {
    console.error("Error booking appointment:", error);
    throw error;
  }
};

// ============================================
// BULK IMPORT UTILITIES
// ============================================

export const bulkUploadServices = async (servicesData) => {
  try {
    const uploaded = [];
    const errors = [];

    for (const serviceData of servicesData) {
      try {
        const newService = {
          ...serviceData,
          deletedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "services"), newService);
        uploaded.push({
          id: docRef.id,
          name: serviceData.name,
        });
      } catch (error) {
        errors.push({
          name: serviceData.name,
          error: error.message,
        });
      }
    }

    return {
      uploaded,
      errors,
      totalAttempted: servicesData.length,
      totalSuccess: uploaded.length,
      totalFailed: errors.length,
    };
  } catch (error) {
    console.error("Error in bulk upload:", error);
    throw error;
  }
};

// ============================================
// RECEPTION & BILLING UTILITIES
// ============================================

export const getReceptionDashboardStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoices = await getDocuments("invoices", []);
    const visits = await getActiveVisits();

    const todayInvoices = invoices.filter((inv) => {
      const invDate = inv.invoiceDate?.toDate?.() || inv.invoiceDate;
      return invDate >= today;
    });

    const todayRevenue = todayInvoices.reduce(
      (sum, inv) => sum + (inv.paidAmount || 0),
      0,
    );
    const pendingPayment = todayInvoices.reduce(
      (sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)),
      0,
    );
    const completedCount = invoices.filter(
      (inv) => inv.status === "paid",
    ).length;

    return {
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      totalActiveVisits: visits.length,
      completedVisits: completedCount,
      pendingPaymentAmount: parseFloat(pendingPayment.toFixed(2)),
      totalInvoices: invoices.length,
      unpaidInvoices: invoices.filter((inv) => inv.status === "unpaid").length,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

export const generateBillHTML = (invoice, customerData) => {
  const date = new Date(invoice.invoiceDate?.toDate?.() || invoice.invoiceDate);
  const itemsHTML = invoice.items
    ?.map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .invoice-id { font-size: 14px; color: #666; }
          .customer-info { margin: 20px 0; }
          .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          td { padding: 8px; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { font-size: 16px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">VELVET PREMIUM UNISEX SALON</div>
          <div class="invoice-id">Invoice #${invoice.id}</div>
          <div style="color: #999; margin-top: 5px;">Date: ${date.toLocaleDateString()}</div>
        </div>

        <div class="customer-info">
          <div class="section-title">CUSTOMER DETAILS</div>
          <div><strong>Name:</strong> ${invoice.customerName}</div>
          <div><strong>Phone:</strong> ${invoice.customerPhone}</div>
          <div><strong>Email:</strong> ${invoice.customerEmail}</div>
        </div>

        <div class="section-title">SERVICES & PRODUCTS</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: <strong>₹${invoice.totalAmount?.toFixed(2)}</strong></div>
          <div>Paid: <strong>₹${invoice.paidAmount?.toFixed(2)}</strong></div>
          <div class="total-row">
            Balance: <span style="color: ${invoice.totalAmount === invoice.paidAmount ? "green" : "red"};">
              ₹${((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toFixed(2)}
            </span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing Velvet Premium Unisex Salon!</p>
          <p>Opposite to ICICI bank, Bharathi Nagar, Kalingarayanpalayam, Bhavani, Erode Dt, Tamil Nadu - 638301</p>
          <p>For queries, contact us at Velvetluxurysalon@gmail.com | 9345678646</p>
          <p>Working Hours: 8:00 AM - 9:00 PM</p>
        </div>
      </body>
    </html>
  `;
};

export const searchInvoicesByCustomer = async (searchTerm) => {
  try {
    const invoices = await getInvoices();
    return invoices.filter(
      (inv) =>
        inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerPhone?.includes(searchTerm) ||
        inv.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  } catch (error) {
    console.error("Error searching invoices:", error);
    throw error;
  }
};

export const getInvoicesByStatus = async (status) => {
  try {
    const invoices = await getInvoices();
    return invoices.filter((inv) => inv.status === status);
  } catch (error) {
    console.error("Error getting invoices by status:", error);
    throw error;
  }
};

export const getInvoicesByDateRange = async (startDate, endDate) => {
  try {
    const invoices = await getInvoices();
    return invoices.filter((inv) => {
      const invDate = inv.invoiceDate?.toDate?.() || inv.invoiceDate;
      return invDate >= startDate && invDate <= endDate;
    });
  } catch (error) {
    console.error("Error getting invoices by date:", error);
    throw error;
  }
};

export const getCustomerInvoiceHistory = async (customerId) => {
  try {
    const invoices = await getInvoices();
    return invoices
      .filter((inv) => inv.customerId === customerId)
      .sort(
        (a, b) =>
          (b.invoiceDate?.toDate?.() || b.invoiceDate) -
          (a.invoiceDate?.toDate?.() || a.invoiceDate),
      );
  } catch (error) {
    console.error("Error getting customer invoice history:", error);
    throw error;
  }
};

export const getTodayVisitsSummary = async () => {
  try {
    const visits = await getActiveVisits();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = visits.filter((v) => {
      const visitDate = v.date?.toDate?.() || v.date;
      return visitDate >= today;
    });

    return {
      total: todayVisits.length,
      checkedIn: todayVisits.filter((v) => v.status === "CHECKED_IN").length,
      inService: todayVisits.filter((v) => v.status === "IN_SERVICE").length,
      waitingPayment: todayVisits.filter((v) => v.status === "WAITING_PAYMENT")
        .length,
      visits: todayVisits,
    };
  } catch (error) {
    console.error("Error getting today visits summary:", error);
    throw error;
  }
};

export const getCustomerStats = async (customerId) => {
  try {
    const invoices = await getCustomerInvoiceHistory(customerId);
    const totalSpent = invoices.reduce(
      (sum, inv) => sum + (inv.paidAmount || 0),
      0,
    );
    const totalVisits = invoices.length;
    const lastVisit =
      invoices[0]?.invoiceDate?.toDate?.() || invoices[0]?.invoiceDate;

    return {
      customerId,
      totalVisits,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      lastVisit,
      averagePerVisit:
        totalVisits > 0 ? parseFloat((totalSpent / totalVisits).toFixed(2)) : 0,
      invoiceCount: invoices.length,
      paidInvoices: invoices.filter((inv) => inv.status === "paid").length,
      unpaidInvoices: invoices.filter((inv) => inv.status === "unpaid").length,
    };
  } catch (error) {
    console.error("Error getting customer stats:", error);
    throw error;
  }
};

// ============================================
// MEMBERSHIP MANAGEMENT
// ============================================

export const initializeMemberships = async () => {
  try {
    const defaultMemberships = {
      regular: {
        id: "regular",
        name: "Regular",
        description: "Standard membership",
        discountPercentage: 0,
        benefits: ["Basic customer service", "Standard pricing"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      membership: {
        id: "membership",
        name: "Premium Membership",
        description: "Premium member benefits",
        discountPercentage: 10,
        benefits: [
          "10% discount on all services",
          "Priority booking",
          "Birthday discount",
          "Loyalty points 1.5x",
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      elite: {
        id: "elite",
        name: "Elite Membership",
        description: "VIP exclusive benefits",
        discountPercentage: 20,
        benefits: [
          "20% discount on all services",
          "VIP priority booking",
          "Exclusive events",
          "Free consultations",
          "Loyalty points 2x",
          "Dedicated concierge",
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    };

    for (const [key, membership] of Object.entries(defaultMemberships)) {
      const docRef = doc(db, "memberships", key);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, membership);
      }
    }

    return true;
  } catch (error) {
    console.error("Error initializing memberships:", error);
    throw error;
  }
};

export const getMemberships = async () => {
  try {
    const membershipsRef = collection(db, "memberships");
    const snapshot = await getDocs(membershipsRef);
    const memberships = [];

    snapshot.forEach((doc) => {
      memberships.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return memberships;
  } catch (error) {
    console.error("Error getting memberships:", error);
    throw error;
  }
};

export const getMembership = async (membershipId) => {
  try {
    const docRef = doc(db, "memberships", membershipId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting membership:", error);
    throw error;
  }
};

export const updateMembership = async (membershipId, membershipData) => {
  try {
    const docRef = doc(db, "memberships", membershipId);
    await updateDoc(docRef, {
      ...membershipData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating membership:", error);
    throw error;
  }
};

export const assignMembershipToCustomer = async (
  customerId,
  membershipType,
) => {
  try {
    const customerRef = doc(db, "customers", customerId);
    await updateDoc(customerRef, {
      membershipType: membershipType,
      membershipAssignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error assigning membership:", error);
    throw error;
  }
};

export const getMembershipDiscount = async (membershipType) => {
  try {
    const membership = await getMembership(membershipType);
    return membership ? membership.discountPercentage : 0;
  } catch (error) {
    console.error("Error getting membership discount:", error);
    return 0;
  }
};

// ============================================
// USER ROLE MANAGEMENT
// ============================================

export const getUserRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role || "receptionist";
    }
    return "receptionist";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "receptionist";
  }
};

export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        email: doc.data().email,
        displayName: doc.data().displayName,
        role: doc.data().role || "receptionist",
        createdAt: doc.data().createdAt,
        lastLogin: doc.data().lastLogin,
      });
    });
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

export const createUserAccount = async (
  email,
  password,
  displayName,
  role = "receptionist",
) => {
  try {
    const newUser = await registerUser(email, password, displayName, role);
    return newUser;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
};

export const updateUserRole = async (uid, role) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      role: role,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const deleteUserAccount = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
};

// ============================================
// CLEANUP UTILS
// ============================================

export const deleteAllVisits = async () => {
  try {
    const visits = await getDocuments("visits");
    console.log(`Found ${visits.length} visits to delete`);

    const deletePromises = visits.map((visit) =>
      deleteDocument("visits", visit.id),
    );
    await Promise.all(deletePromises);

    console.log("All visits deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting all visits:", error);
    throw error;
  }
};

// Get customers with birthdays today
export const getTodaysBirthdayCustomers = async () => {
  try {
    const customers = await getCustomers(false);
    const today = new Date();

    const birthdayCustomers = customers.filter((customer) => {
      if (!customer.dateOfBirth) return false;

      let dob;
      if (typeof customer.dateOfBirth === "string") {
        dob = new Date(customer.dateOfBirth);
      } else if (customer.dateOfBirth.toDate) {
        dob = customer.dateOfBirth.toDate();
      } else {
        return false;
      }

      // Check if month and day match (ignore year)
      return (
        dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()
      );
    });

    return birthdayCustomers;
  } catch (error) {
    console.error("Error getting birthday customers:", error);
    return [];
  }
};

// ============================================
// COUPON CODE MANAGEMENT
// ============================================

export const createCoupon = async (couponData) => {
  try {
    const couponCode = couponData.code.toUpperCase().trim();

    // Check if coupon code already exists
    const existingCoupon = await getDocument("coupons", couponCode);
    if (existingCoupon) {
      throw new Error("Coupon code already exists");
    }

    const couponObj = {
      code: couponCode,
      discountType: couponData.discountType || "flat", // "flat" or "percentage"
      discountValue: parseFloat(couponData.discountValue) || 0,
      maxUsageCount: parseInt(couponData.maxUsageCount) || null, // null = unlimited
      currentUsageCount: 0,
      minOrderAmount: parseFloat(couponData.minOrderAmount) || 0,
      maxDiscountAmount: parseFloat(couponData.maxDiscountAmount) || null, // max discount cap
      validFrom: couponData.validFrom || serverTimestamp(),
      validUntil: couponData.validUntil || null, // null = no expiry
      isActive: couponData.isActive !== false, // default true
      description: couponData.description || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "coupons", couponCode), couponObj);
    return couponCode;
  } catch (error) {
    console.error("Error creating coupon:", error);
    throw error;
  }
};

export const getCoupons = async () => {
  try {
    const coupons = await getDocuments("coupons", [
      { type: "orderBy", field: "createdAt", direction: "desc" },
    ]);
    return coupons;
  } catch (error) {
    console.error("Error getting coupons:", error);
    throw error;
  }
};

export const getCoupon = async (couponCode) => {
  try {
    const coupon = await getDocument(
      "coupons",
      couponCode.toUpperCase().trim(),
    );
    return coupon;
  } catch (error) {
    console.error("Error getting coupon:", error);
    throw error;
  }
};

export const validateCoupon = async (couponCode, orderAmount) => {
  try {
    const coupon = await getCoupon(couponCode);

    if (!coupon) {
      throw new Error("Coupon code not found");
    }

    if (!coupon.isActive) {
      throw new Error("This coupon is inactive");
    }

    // Check expiry
    const now = new Date();
    if (coupon.validUntil) {
      const expiryDate =
        coupon.validUntil?.toDate?.() || new Date(coupon.validUntil);
      if (now > expiryDate) {
        throw new Error("Coupon has expired");
      }
    }

    if (coupon.validFrom) {
      const startDate =
        coupon.validFrom?.toDate?.() || new Date(coupon.validFrom);
      if (now < startDate) {
        throw new Error("Coupon is not yet valid");
      }
    }

    // Check usage limit
    if (
      coupon.maxUsageCount &&
      coupon.currentUsageCount >= coupon.maxUsageCount
    ) {
      throw new Error("Coupon usage limit exceeded");
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      throw new Error(
        `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      );
    }

    // Calculate discount
    let discountAmount = 0;
    let isCapped = false;
    let originalDiscountAmount = 0;

    if (coupon.discountType === "percentage") {
      originalDiscountAmount = (orderAmount * coupon.discountValue) / 100;
      discountAmount = originalDiscountAmount;

      // Apply max discount cap if set
      if (
        coupon.maxDiscountAmount &&
        discountAmount > coupon.maxDiscountAmount
      ) {
        discountAmount = coupon.maxDiscountAmount;
        isCapped = true;
      }
    } else {
      // flat discount
      originalDiscountAmount = coupon.discountValue;
      discountAmount = coupon.discountValue;

      // Don't allow discount more than order amount
      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
        isCapped = true;
      }
    }

    return {
      valid: true,
      coupon: coupon,
      discountAmount: discountAmount,
      originalDiscountAmount: originalDiscountAmount,
      isCapped: isCapped,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

export const updateCoupon = async (couponCode, updateData) => {
  try {
    const cleanData = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    await updateDocument("coupons", couponCode.toUpperCase().trim(), {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    throw error;
  }
};

export const deleteCoupon = async (couponCode) => {
  try {
    await deleteDocument("coupons", couponCode.toUpperCase().trim());
  } catch (error) {
    console.error("Error deleting coupon:", error);
    throw error;
  }
};

export const deactivateCoupon = async (couponCode) => {
  try {
    await updateCoupon(couponCode, { isActive: false });
  } catch (error) {
    console.error("Error deactivating coupon:", error);
    throw error;
  }
};

export const incrementCouponUsage = async (couponCode) => {
  try {
    const coupon = await getCoupon(couponCode);
    if (!coupon) {
      throw new Error("Coupon not found");
    }

    const newUsageCount = (coupon.currentUsageCount || 0) + 1;

    // Deactivate if max usage reached
    const isActive =
      !coupon.maxUsageCount || newUsageCount < coupon.maxUsageCount;

    await updateCoupon(couponCode, {
      currentUsageCount: newUsageCount,
      isActive: isActive,
    });

    return newUsageCount;
  } catch (error) {
    console.error("Error incrementing coupon usage:", error);
    throw error;
  }
};
