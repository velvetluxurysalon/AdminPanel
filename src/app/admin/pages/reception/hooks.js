import { useState, useEffect } from 'react';
import {
  getActiveVisits, getServices, getProducts, getStaff
} from '../../utils/firebaseUtils';

export const useReceptionData = () => {
  const [visits, setVisits] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAllData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [visitsData, servicesData, productsData, staffData] = await Promise.all([
        getActiveVisits(),
        getServices(false),
        getProducts(),
        getStaff()
      ]);
      console.log('🔄 Reception fetched visits:', visitsData);
      setVisits(visitsData || []);
      setServices(servicesData || []);
      setProducts(productsData || []);
      setStaff(staffData || []);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchAllData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    visits,
    setVisits,
    services,
    products,
    staff,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    fetchAllData
  };
};

export const useReceptionStates = () => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [activeSection, setActiveSection] = useState('checkout');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showBillOptions, setShowBillOptions] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedVisitForCheckout, setSelectedVisitForCheckout] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('services');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [assigningStaff, setAssigningStaff] = useState(null);
  const [assignedStaff, setAssignedStaff] = useState({});
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  return {
    showCheckIn,
    setShowCheckIn,
    activeSection,
    setActiveSection,
    selectedVisit,
    setSelectedVisit,
    expandedRow,
    setExpandedRow,
    showAddItems,
    setShowAddItems,
    showCheckout,
    setShowCheckout,
    showBillOptions,
    setShowBillOptions,
    showCheckoutModal,
    setShowCheckoutModal,
    selectedVisitForCheckout,
    setSelectedVisitForCheckout,
    selectedCategory,
    setSelectedCategory,
    selectedServices,
    setSelectedServices,
    selectedProducts,
    setSelectedProducts,
    assigningStaff,
    setAssigningStaff,
    assignedStaff,
    setAssignedStaff,
    discountPercent,
    setDiscountPercent,
    discountAmount,
    setDiscountAmount,
    paymentMode,
    setPaymentMode,
    amountPaid,
    setAmountPaid,
    notes,
    setNotes,
    processingPayment,
    setProcessingPayment,
    invoiceNumber,
    setInvoiceNumber,
    searchTerm,
    setSearchTerm
  };
};
