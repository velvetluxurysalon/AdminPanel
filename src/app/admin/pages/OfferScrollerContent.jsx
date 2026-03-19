import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
  Type,
} from "lucide-react";
import { getOfferText, updateOfferText } from "../services/contentService";

const OfferScrollerContent = () => {
  const [offerText, setOfferText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    loadOfferText();
  }, []);

  const loadOfferText = async () => {
    try {
      setIsLoading(true);
      const data = await getOfferText();
      if (data) {
        setOfferText(data.text);
        setIsActive(data.isActive ?? true);
      } else {
        setOfferText(
          "Get 20% OFF on all services! Use code VELVET20 at checkout.",
        );
        setIsActive(true);
      }
      setError("");
    } catch (err) {
      setError("Failed to load offer text");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!offerText.trim()) {
        setError("Please enter offer text");
        return;
      }

      setIsSaving(true);
      await updateOfferText(offerText.trim(), isActive);
      setSuccess("Offer scroller updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save offer text");
      console.error(err);
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div
          className="loading-spinner"
          style={{ width: 40, height: 40, borderWidth: 3, margin: "0 auto" }}
        ></div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .offer-scroller-container {
          display: grid;
          gap: 2rem;
        }

        .offer-scroller-form {
          display: grid;
          gap: 2rem;
        }

        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .offer-scroll-preview {
          animation: scroll 30s linear infinite;
          display: inline-block;
          white-space: nowrap;
          padding-right: 100%;
        }
        
        .offer-scroll-preview:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .offer-scroller-form {
            gap: 1.5rem !important;
          }

          .scroller-input {
            font-size: 16px !important;
            width: 100%;
            min-height: 40px;
            padding: 0.75rem !important;
          }

          .scroller-preview {
            height: 50px !important;
            padding: 0.75rem 0 !important;
            font-size: 0.75rem !important;
          }

          .scroller-preview p {
            font-size: 0.75rem !important;
          }

          .scroller-button-group {
            display: flex !important;
            flex-direction: row !important;
            gap: 0.75rem !important;
            justify-content: flex-end !important;
          }

          .scroller-button {
            padding: 0.6rem 1rem !important;
            font-size: 0.8rem !important;
            min-height: 40px !important;
          }
        }

        @media (max-width: 480px) {
          .offer-scroller-form {
            gap: 1rem !important;
          }

          .scroller-input {
            font-size: 16px !important;
            padding: 0.6rem !important;
            min-height: 40px !important;
            width: 100%;
          }

          .scroller-preview {
            height: 45px !important;
            padding: 0.5rem 0 !important;
          }

          .scroller-preview p {
            font-size: 0.65rem !important;
          }

          .scroller-button-group {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }

          .scroller-button {
            width: 100% !important;
            padding: 0.65rem 1rem !important;
            font-size: 0.75rem !important;
            min-height: 40px !important;
          }
        }
      `}</style>

      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid #dc2626",
            borderRadius: "var(--admin-radius-sm)",
            color: "#dc2626",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            backgroundColor: "rgba(5, 150, 105, 0.1)",
            border: "1px solid #059669",
            borderRadius: "var(--admin-radius-sm)",
            color: "#059669",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2
            className="card-title"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Type size={20} /> Offer Scroller
          </h2>
        </div>

        <div className="card-content" style={{ display: "grid", gap: "2rem" }}>
          {/* Status Toggle */}
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--admin-secondary)",
              borderRadius: "var(--admin-radius-sm)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                {isActive ? (
                  <Eye size={20} color="#059669" />
                ) : (
                  <EyeOff size={20} color="#9ca3af" />
                )}
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "var(--admin-foreground)",
                    }}
                  >
                    Display Status
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      fontSize: "0.875rem",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    {isActive
                      ? "Scroller is visible on homepage"
                      : "Scroller is hidden"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                style={{
                  padding: "0.5rem 1.5rem",
                  backgroundColor: isActive ? "#059669" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--admin-radius-sm)",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                  transition: "background-color 0.2s",
                }}
              >
                {isActive ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>

          {/* Offer Text Input */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "var(--admin-muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Scroller Text *
            </label>
            <textarea
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              className="input scroller-input"
              placeholder="Enter your promotional text... (e.g., 'Get 20% OFF on all services! Use code VELVET20 at checkout.')"
              style={{
                minHeight: "100px",
                resize: "vertical",
                fontFamily: "inherit",
                padding: "0.75rem",
                borderRadius: "var(--admin-radius-sm)",
              }}
            />
            <p
              style={{
                margin: "0.5rem 0 0 0",
                fontSize: "0.75rem",
                color: "var(--admin-muted-foreground)",
              }}
            >
              {offerText.length} characters
            </p>
          </div>

          {/* Preview */}
          <div>
            <p
              style={{
                margin: "0 0 1rem 0",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "var(--admin-muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Live Preview
            </p>
            <div
              className="scroller-preview"
              style={{
                backgroundColor: "#c9a227",
                borderRadius: "var(--admin-radius-sm)",
                padding: "1rem 0",
                overflow: "hidden",
                height: "60px",
                display: "flex",
                alignItems: "center",
                border: "2px dashed var(--admin-border)",
                position: "relative",
              }}
            >
              {offerText ? (
                <>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="offer-scroll-preview"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          color: "white",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ✨ {offerText} ✨
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          color: "white",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                          marginLeft: "2rem",
                        }}
                      >
                        ✨ {offerText} ✨
                      </p>
                    </div>
                    {/* Fade effects */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "30px",
                        background:
                          "linear-gradient(to right, rgba(201,162,39,1), rgba(201,162,39,0))",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: "30px",
                        background:
                          "linear-gradient(to left, rgba(201,162,39,1), rgba(201,162,39,0))",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </>
              ) : (
                <p
                  style={{
                    margin: 0,
                    width: "100%",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.875rem",
                  }}
                >
                  Preview will appear here...
                </p>
              )}
            </div>
            <p
              style={{
                margin: "0.75rem 0 0 0",
                fontSize: "0.75rem",
                color: "var(--admin-muted-foreground)",
              }}
            >
              Tip: The text will scroll continuously from right to left on the
              homepage.
            </p>
          </div>

          {/* Save Button */}
          <div
            className="scroller-button-group"
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={loadOfferText}
              className="scroller-button"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                border: "1px solid var(--admin-border)",
                borderRadius: "var(--admin-radius-sm)",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: "var(--admin-foreground)",
                transition: "all 0.2s",
              }}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="scroller-button"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--admin-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--admin-radius-sm)",
                cursor: isSaving ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                opacity: isSaving ? 0.6 : 1,
                transition: "all 0.2s",
              }}
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: "1rem" }}>
            💡 How It Works
          </h3>
        </div>
        <div className="card-content">
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.5rem",
              color: "var(--admin-muted-foreground)",
              fontSize: "0.875rem",
              lineHeight: "1.8",
            }}
          >
            <li>
              Edit the promotional text above to display your current offer
            </li>
            <li>
              Toggle visibility to show/hide the scroller on your homepage
            </li>
            <li>Use the preview to see how it will look on the website</li>
            <li>The text will scroll continuously from right to left</li>
            <li>
              Perfect for announcing sales, new services, or special promotions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfferScrollerContent;
