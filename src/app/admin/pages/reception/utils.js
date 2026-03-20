export const calculateTotals = (
  visit,
  discountAmount,
  discountPercent,
  amountPaid,
) => {
  const items = visit?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const discount =
    discountAmount > 0 ? discountAmount : (subtotal * discountPercent) / 100;
  const total = subtotal - discount;
  const balance = total - amountPaid;

  return { subtotal, discount, total, balance };
};

export const filterVisitsByStatus = (visits, activeSection, searchTerm) => {
  return visits.filter((v) => {
    if (activeSection === "onreception" && v.status !== "ON_RECEPTION")
      return false;
    if (activeSection === "checkin" && v.status !== "CHECKED_IN") return false;
    if (activeSection === "checkout" && v.status !== "READY_FOR_BILLING")
      return false;
    if (activeSection === "completed" && v.status !== "COMPLETED") return false;
    if (activeSection === "today-completed") {
      if (v.status !== "COMPLETED") return false;
      // Filter by today's date
      const visitDate = v.date?.seconds
        ? new Date(v.date.seconds * 1000)
        : new Date(v.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 86400000);
      if (visitDate < today || visitDate >= tomorrow) return false;
    }

    // Handle both customer object structure and appointment structure
    const customerName = v.customer?.name || v.customerName || v.name || "";
    const customerPhone =
      v.customer?.phone ||
      v.customer?.contactNo ||
      v.customerPhone ||
      v.phone ||
      v.contactNo ||
      "";

    return (
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm)
    );
  });
};

export const getStatusBadge = (status) => {
  const badges = {
    CHECKED_IN: {
      color: "#f59e0b",
      bg: "#fef3c7",
      icon: "🟡",
      text: "Checked In",
    },
    READY_FOR_BILLING: {
      color: "#8b5cf6",
      bg: "#ede9fe",
      icon: "🟣",
      text: "Ready for Billing",
    },
    COMPLETED: {
      color: "#10b981",
      bg: "#d1fae5",
      icon: "✅",
      text: "Completed",
    },
  };
  return (
    badges[status] || {
      color: "#6b7280",
      bg: "#f3f4f6",
      icon: "⚪",
      text: status,
    }
  );
};
