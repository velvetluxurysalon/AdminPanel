import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  Calendar,
  Percent,
  DollarSign,
  Tag,
} from "lucide-react";
import {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  deactivateCoupon,
} from "../utils/firebaseUtils";

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "flat",
    discountValue: "",
    maxUsageCount: "",
    minOrderAmount: "0",
    maxDiscountAmount: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await getCoupons();
      setCoupons(data);
    } catch (err) {
      setError("Failed to load coupons");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      setError("Coupon code is required");
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      if (editingCoupon) {
        // Update coupon
        await updateCoupon(editingCoupon.code, {
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          maxUsageCount: formData.maxUsageCount
            ? parseInt(formData.maxUsageCount)
            : null,
          minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
          maxDiscountAmount: formData.maxDiscountAmount
            ? parseFloat(formData.maxDiscountAmount)
            : null,
          validFrom: new Date(formData.validFrom),
          validUntil: formData.validUntil
            ? new Date(formData.validUntil)
            : null,
          description: formData.description,
          isActive: formData.isActive,
        });
        setSuccess("Coupon updated successfully");
        setEditingCoupon(null);
      } else {
        // Create coupon
        const couponCode = await createCoupon({
          code: formData.code,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          maxUsageCount: formData.maxUsageCount
            ? parseInt(formData.maxUsageCount)
            : null,
          minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
          maxDiscountAmount: formData.maxDiscountAmount
            ? parseFloat(formData.maxDiscountAmount)
            : null,
          validFrom: new Date(formData.validFrom),
          validUntil: formData.validUntil
            ? new Date(formData.validUntil)
            : null,
          description: formData.description,
          isActive: formData.isActive,
        });
        setSuccess(`Coupon created: ${couponCode}`);
      }

      // Reset form
      setShowForm(false);
      setFormData({
        code: "",
        discountType: "flat",
        discountValue: "",
        maxUsageCount: "",
        minOrderAmount: "0",
        maxDiscountAmount: "",
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: "",
        description: "",
        isActive: true,
      });

      // Refresh list
      fetchCoupons();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save coupon");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType || "flat",
      discountValue: coupon.discountValue?.toString() || "",
      maxUsageCount: coupon.maxUsageCount?.toString() || "",
      minOrderAmount: coupon.minOrderAmount?.toString() || "0",
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
      validFrom:
        coupon.validFrom?.toDate?.().toISOString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      validUntil:
        coupon.validUntil?.toDate?.().toISOString().split("T")[0] || "",
      description: coupon.description || "",
      isActive: coupon.isActive !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (couponCode) => {
    if (window.confirm(`Delete coupon ${couponCode}?`)) {
      try {
        setLoading(true);
        await deleteCoupon(couponCode);
        setSuccess("Coupon deleted successfully");
        fetchCoupons();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Failed to delete coupon");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (couponCode, isActive) => {
    try {
      setLoading(true);
      await updateCoupon(couponCode, { isActive: !isActive });
      setSuccess(`Coupon ${!isActive ? "activated" : "deactivated"}`);
      fetchCoupons();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update coupon");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    } else {
      return `₹${coupon.discountValue}`;
    }
  };

  const getStatus = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { label: "Inactive", color: "#6b7280" };
    if (coupon.validUntil) {
      const expiryDate =
        coupon.validUntil?.toDate() || new Date(coupon.validUntil);
      if (now > expiryDate) return { label: "Expired", color: "#dc2626" };
    }
    if (
      coupon.maxUsageCount &&
      coupon.currentUsageCount >= coupon.maxUsageCount
    ) {
      return { label: "Limit Reached", color: "#ea580c" };
    }
    return { label: "Active", color: "#16a34a" };
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>
          Coupon Management
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingCoupon(null);
              setFormData({
                code: "",
                discountType: "flat",
                discountValue: "",
                maxUsageCount: "",
                minOrderAmount: "0",
                maxDiscountAmount: "",
                validFrom: new Date().toISOString().split("T")[0],
                validUntil: "",
                description: "",
                isActive: true,
              });
              setShowForm(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            <Plus size={20} />
            New Coupon
          </button>
        )}
      </div>

      {success && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "0.375rem",
            border: "1px solid #a7f3d0",
          }}
        >
          ✓ {success}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "0.375rem",
            border: "1px solid #fecaca",
          }}
        >
          ✗ {error}
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
            }}
          >
            {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: "1.5rem" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Coupon Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleFormChange}
                  placeholder="e.g., SUMMER20"
                  disabled={!!editingCoupon}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Discount Type
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                >
                  <option value="flat">Flat Discount (₹)</option>
                  <option value="percentage">Percentage Discount (%)</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Discount Value
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleFormChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Min Order Amount (₹)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleFormChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Max Discount Cap (₹)
                </label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount}
                  onChange={handleFormChange}
                  placeholder="Optional"
                  step="0.01"
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Valid From
                </label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Valid Until
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleFormChange}
                  placeholder="Leave empty for no expiry"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontWeight: "500",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                >
                  Max Usage Count
                </label>
                <input
                  type="number"
                  name="maxUsageCount"
                  value={formData.maxUsageCount}
                  onChange={handleFormChange}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontWeight: "500",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="e.g., Summer promotion, First-time customer offer..."
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  minHeight: "100px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleFormChange}
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="isActive"
                style={{ fontWeight: "500", cursor: "pointer" }}
              >
                Active
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCoupon(null);
                }}
                style={{
                  padding: "0.625rem 1.25rem",
                  background: "#e5e7eb",
                  color: "#111827",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.625rem 1.25rem",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "500",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? "Saving..."
                  : editingCoupon
                    ? "Update Coupon"
                    : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
      ) : coupons.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#f9fafb",
            borderRadius: "0.5rem",
            color: "#6b7280",
          }}
        >
          <Tag size={48} style={{ margin: "1rem auto", opacity: 0.3 }} />
          <p>No coupons yet. Create one to get started.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          {coupons.map((coupon) => {
            const status = getStatus(coupon);
            return (
              <div
                key={coupon.code}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 0.5fr",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <code
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "bold",
                        background: "#f3f4f6",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCopyCode(coupon.code)}
                    >
                      {coupon.code}
                    </code>
                    {copiedCode === coupon.code && (
                      <span style={{ color: "#10b981", fontSize: "0.875rem" }}>
                        ✓ Copied
                      </span>
                    )}
                    {copiedCode !== coupon.code && (
                      <Copy
                        size={16}
                        style={{ cursor: "pointer", color: "#9ca3af" }}
                        onClick={() => handleCopyCode(coupon.code)}
                      />
                    )}
                  </div>
                  {coupon.description && (
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {coupon.description}
                    </p>
                  )}
                </div>

                <div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: "600", display: "block" }}>
                      {coupon.discountType === "percentage" ? (
                        <>
                          <Percent
                            size={16}
                            style={{
                              display: "inline",
                              marginRight: "0.25rem",
                            }}
                          />
                          {coupon.discountValue}% OFF
                        </>
                      ) : (
                        <>
                          <DollarSign
                            size={16}
                            style={{
                              display: "inline",
                              marginRight: "0.25rem",
                            }}
                          />
                          ₹{coupon.discountValue}
                        </>
                      )}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Min: ₹{coupon.minOrderAmount}
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Usage: {coupon.currentUsageCount || 0}
                    {coupon.maxUsageCount
                      ? ` / ${coupon.maxUsageCount}`
                      : " / Unlimited"}
                  </p>
                </div>

                <div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        background: status.color,
                        color: "#fff",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  {coupon.validUntil && (
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      <Calendar
                        size={14}
                        style={{ display: "inline", marginRight: "0.25rem" }}
                      />
                      Expires:{" "}
                      {new Date(
                        coupon.validUntil?.toDate?.() || coupon.validUntil,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => handleEdit(coupon)}
                    style={{
                      padding: "0.5rem",
                      background: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      displayProperty: "flex",
                      alignItems: "center",
                    }}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleToggleActive(coupon.code, coupon.isActive)
                    }
                    style={{
                      padding: "0.5rem",
                      background: coupon.isActive ? "#ef4444" : "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                    }}
                    title={coupon.isActive ? "Deactivate" : "Activate"}
                  >
                    {coupon.isActive ? <X size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.code)}
                    style={{
                      padding: "0.5rem",
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
