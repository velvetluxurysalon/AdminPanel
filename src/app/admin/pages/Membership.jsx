import { useState, useEffect } from "react";
import { Edit, Save, X, Plus } from "lucide-react";
import {
  getMemberships,
  updateMembership,
  initializeMemberships,
} from "../utils/firebaseUtils";

const MembershipManagement = () => {
  const [memberships, setMemberships] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      setError("");

      // Initialize default memberships if they don't exist
      await initializeMemberships();

      const data = await getMemberships();
      setMemberships(data);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      setError("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (membership) => {
    setEditingId(membership.id);
    setEditFormData({ ...membership });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBenefitChange = (index, value) => {
    const newBenefits = [...editFormData.benefits];
    newBenefits[index] = value;
    setEditFormData((prev) => ({
      ...prev,
      benefits: newBenefits,
    }));
  };

  const addBenefit = () => {
    setEditFormData((prev) => ({
      ...prev,
      benefits: [...(prev.benefits || []), ""],
    }));
  };

  const removeBenefit = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (membershipId) => {
    try {
      setError("");
      await updateMembership(membershipId, {
        name: editFormData.name,
        description: editFormData.description,
        discountPercentage: parseInt(editFormData.discountPercentage) || 0,
        price: parseFloat(editFormData.price) || 0,
        benefits: editFormData.benefits.filter((b) => b.trim()),
      });

      setSuccessMessage("Membership updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setEditingId(null);
      setEditFormData({});
      fetchMemberships();
    } catch (error) {
      console.error("Error updating membership:", error);
      setError("Failed to update membership");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1
        style={{ marginBottom: "2rem", fontSize: "2rem", fontWeight: "bold" }}
      >
        Membership Management
      </h1>

      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #f88",
            color: "#f00",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: "#efe",
            border: "1px solid #8f8",
            color: "#080",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          {successMessage}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {memberships.map((membership) => (
          <div
            key={membership.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "1.5rem",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {editingId === membership.id ? (
              // Edit Mode
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <input
                  type="text"
                  placeholder="Membership Name"
                  value={editFormData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                />

                <textarea
                  placeholder="Description"
                  value={editFormData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    minHeight: "60px",
                  }}
                />

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFormData.discountPercentage || 0}
                    onChange={(e) =>
                      handleInputChange("discountPercentage", e.target.value)
                    }
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter membership price"
                    value={editFormData.price || ""}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "1rem",
                      width: "100%",
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <label style={{ fontWeight: "500" }}>Benefits</label>
                    <button
                      onClick={addBenefit}
                      style={{
                        background: "#667eea",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>

                  {editFormData.benefits?.map((benefit, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) =>
                          handleBenefitChange(index, e.target.value)
                        }
                        placeholder={`Benefit ${index + 1}`}
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          flex: 1,
                        }}
                      />
                      <button
                        onClick={() => removeBenefit(index)}
                        style={{
                          background: "#fee",
                          color: "#f00",
                          border: "none",
                          padding: "0.5rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => handleSave(membership.id)}
                    style={{
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <Save size={18} /> Save
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      background: "#ddd",
                      color: "#333",
                      border: "none",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "1.25rem",
                        fontWeight: "600",
                      }}
                    >
                      {membership.name}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 0.5rem",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      {membership.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEdit(membership)}
                    style={{
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                </div>

                <div
                  style={{
                    background: "#f0f4ff",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#667eea",
                    }}
                  >
                    {membership.discountPercentage}% Discount
                  </p>
                </div>

                {membership.price && (
                  <div
                    style={{
                      background: "#fff3cd",
                      padding: "0.75rem",
                      borderRadius: "6px",
                      marginBottom: "1rem",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        color: "#856404",
                      }}
                    >
                      ₹
                      {typeof membership.price === "number"
                        ? membership.price.toFixed(2)
                        : (parseFloat(membership.price) || 0).toFixed(2)}{" "}
                      one-time
                    </p>
                  </div>
                )}

                <div>
                  <h4 style={{ margin: "0 0 0.75rem", fontWeight: "600" }}>
                    Benefits:
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {membership.benefits?.map((benefit, index) => (
                      <li
                        key={index}
                        style={{ color: "#333", fontSize: "0.95rem" }}
                      >
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembershipManagement;
