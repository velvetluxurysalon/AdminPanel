import { useState, useEffect } from "react";
import { Trash2, Plus, Edit2, Percent } from "lucide-react";
import {
  getSpecialOffers,
  addSpecialOffer,
  updateSpecialOffer,
  deleteSpecialOffer,
  uploadImage,
} from "../services/contentService";

const OffersContent = () => {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount: "",
    image: "",
    validity: "",
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      const data = await getSpecialOffers();
      setOffers(data);
      setError("");
    } catch (err) {
      setError("Failed to load offers");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadImage(file, "offers");
      setFormData((prev) => ({ ...prev, image: url }));
      setSuccess("Image uploaded successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload image");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.discount ||
        !formData.image ||
        !formData.validity
      ) {
        setError("Please fill all required fields");
        return;
      }

      if (editingId) {
        await updateSpecialOffer(editingId, formData);
        setSuccess("Offer updated successfully");
      } else {
        await addSpecialOffer(formData);
        setSuccess("Offer added successfully");
      }

      setTimeout(() => setSuccess(""), 3000);
      setFormData({
        title: "",
        description: "",
        discount: "",
        image: "",
        validity: "",
      });
      setIsAddingNew(false);
      setEditingId(null);
      await loadOffers();
    } catch (err) {
      setError("Failed to save offer");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      await deleteSpecialOffer(id);
      setSuccess("Offer deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
      await loadOffers();
    } catch (err) {
      setError("Failed to delete offer");
      console.error(err);
    }
  };

  const handleEdit = (offer) => {
    setFormData({
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      image: offer.image,
      validity: offer.validity,
    });
    setEditingId(offer.id);
    setIsAddingNew(true);
  };

  return (
    <div>
      <style>{`
        #offers-container {
          display: grid;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1023px) {
          #offers-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
          }

          #offers-form-panel {
            order: -1;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          #offers-container {
            gap: 1rem !important;
            padding: 0;
          }

          .offer-card {
            padding: 0.75rem !important;
            gap: 0.75rem !important;
          }

          .offer-card img {
            width: 60px !important;
            height: 60px !important;
            flex-shrink: 0;
          }

          .offer-card-info {
            flex: 1;
          }

          .offer-card-info p {
            margin: 0 0 0.25rem 0 !important;
            font-size: 0.8rem !important;
            line-height: 1.3 !important;
          }

          .offer-card-info > p:first-child {
            font-weight: 600 !important;
            font-size: 0.85rem !important;
          }

          .offer-card-discount {
            font-size: 0.75rem !important;
          }

          .offer-card-validity {
            font-size: 0.7rem !important;
          }

          .offer-card-actions {
            display: flex !important;
            gap: 0.25rem !important;
            margin-top: 0.5rem !important;
          }

          .offer-card-actions button {
            padding: 0.4rem !important;
            min-width: 32px !important;
            min-height: 32px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          #offers-form-panel {
            width: 100%;
          }

          .offer-form-input {
            font-size: 16px !important;
            width: 100%;
            min-height: 40px;
          }

          .offer-form-button {
            padding: 0.65rem 1rem !important;
            font-size: 0.85rem !important;
            min-height: 40px !important;
            width: 100%;
          }

          .offer-form-button-group {
            display: flex !important;
            flex-direction: row !important;
            gap: 1rem !important;
          }

          .offer-form-button-group button {
            flex: 1 !important;
          }
        }

        @media (max-width: 480px) {
          #offers-container {
            gap: 0.75rem !important;
            padding: 0.5rem !important;
            margin: 0 !important;
          }

          .offer-card {
            padding: 0.5rem !important;
          }

          .offer-card img {
            width: 50px !important;
            height: 50px !important;
          }

          .offer-card-info p {
            font-size: 0.7rem !important;
          }

          .offer-card-actions button svg {
            width: 12px !important;
            height: 12px !important;
          }

          .offer-form-input {
            font-size: 16px !important;
            padding: 0.6rem !important;
            min-height: 40px !important;
            width: 100%;
          }

          .offer-form-button {
            padding: 0.65rem 1rem !important;
            font-size: 0.8rem !important;
            min-height: 40px !important;
          }

          .offer-form-button-group {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }

          .offer-form-button-group button {
            width: 100% !important;
          }
        }
      `}</style>

      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid #dc2626",
            borderRadius: "var(--admin-radius-sm)",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "rgba(5, 150, 105, 0.1)",
            border: "1px solid #059669",
            borderRadius: "var(--admin-radius-sm)",
            color: "#059669",
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "2rem",
          alignItems: "start",
        }}
        id="offers-container"
      >
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Active Offers</h2>
          </div>
          <div className="card-content">
            {isLoading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div
                  className="loading-spinner"
                  style={{ width: 40, height: 40, borderWidth: 3 }}
                ></div>
              </div>
            ) : offers.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--admin-muted-foreground)",
                }}
              >
                No offers yet. Add one to get started!
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="offer-card"
                    style={{
                      padding: "1rem",
                      backgroundColor: "var(--admin-secondary)",
                      borderRadius: "var(--admin-radius-sm)",
                      border: "1px solid var(--admin-border)",
                      display: "flex",
                      gap: "1rem",
                    }}
                  >
                    {offer.image && (
                      <img
                        src={offer.image}
                        alt={offer.title}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "var(--admin-radius-sm)",
                        }}
                      />
                    )}
                    <div className="offer-card-info" style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 0.25rem 0",
                          fontWeight: "600",
                          color: "var(--admin-foreground)",
                          fontSize: "1rem",
                        }}
                      >
                        {offer.title}
                      </p>
                      <p
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "0.875rem",
                          color: "var(--admin-foreground)",
                        }}
                      >
                        {offer.description}
                      </p>
                      <div
                        className="offer-card-discount"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <Percent
                          size={14}
                          style={{ color: "var(--admin-primary)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "var(--admin-primary)",
                          }}
                        >
                          {offer.discount}% Off
                        </span>
                      </div>
                      <p
                        className="offer-card-validity"
                        style={{
                          margin: "0",
                          fontSize: "0.75rem",
                          color: "var(--admin-muted-foreground)",
                        }}
                      >
                        Valid until:{" "}
                        {new Date(offer.validity).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className="offer-card-actions"
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "0.75rem",
                      }}
                    >
                      <button
                        onClick={() => handleEdit(offer)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--admin-primary)",
                          flex: 1,
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--danger)",
                          flex: 1,
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{ height: "fit-content" }}
          id="offers-form-panel"
        >
          <div className="card-header">
            <h2 className="card-title">{editingId ? "Edit" : "Add"} Offer</h2>
          </div>
          <div className="card-content">
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="btn btn-primary offer-form-button"
                style={{ width: "100%" }}
              >
                <Plus size={18} /> Add Offer
              </button>
            ) : (
              <form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    className="input offer-form-input"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Offer title"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    Description *
                  </label>
                  <textarea
                    className="input offer-form-input"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Offer description"
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    Discount (%) *
                  </label>
                  <input
                    type="number"
                    className="input offer-form-input"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    placeholder="e.g. 20"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    className="input offer-form-input"
                    value={formData.validity}
                    onChange={(e) =>
                      setFormData({ ...formData, validity: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="input offer-form-input"
                    style={{ cursor: "pointer" }}
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{
                        marginTop: "1rem",
                        maxWidth: "100%",
                        maxHeight: "150px",
                        borderRadius: "var(--admin-radius-sm)",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>

                <div
                  className="offer-form-button-group"
                  style={{ display: "flex", gap: "1rem" }}
                >
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-primary offer-form-button"
                    style={{ flex: 1 }}
                  >
                    {editingId ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingId(null);
                      setFormData({
                        title: "",
                        description: "",
                        discount: "",
                        image: "",
                        validity: "",
                      });
                    }}
                    className="btn btn-secondary offer-form-button"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersContent;
