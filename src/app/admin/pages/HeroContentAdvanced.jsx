import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Palette,
} from "lucide-react";
import {
  getHeroContent,
  updateHeroContent,
  uploadImage,
} from "../services/contentService";

const HeroContentAdvanced = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [slides, setSlides] = useState([]);
  const [selectedSlideId, setSelectedSlideId] = useState(null);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [showLayerForm, setShowLayerForm] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [editingLayer, setEditingLayer] = useState(null);
  const [activeTab, setActiveTab] = useState("images"); // "images" or "text"

  // Form states
  const [slideForm, setSlideForm] = useState({
    heading: "",
    subheading: "",
    ctaButtonText: "",
    ctaButtonLink: "",
  });
  const [layerForm, setLayerForm] = useState({
    type: "image",
    content: "",
    opacity: 1,
    order: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const heroContent = await getHeroContent();
      if (heroContent?.slides) {
        setSlides(heroContent.slides);
        if (heroContent.slides.length > 0) {
          setSelectedSlideId(heroContent.slides[0].id);
        }
      } else {
        setSlides([]);
      }
      setError("");
    } catch (err) {
      setError("Failed to load hero content");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSlide = slides.find((s) => s.id === selectedSlideId);
  const sortedLayers = selectedSlide?.layers
    ? [...selectedSlide.layers].sort((a, b) => a.order - b.order)
    : [];

  // Add new slide
  const handleAddSlide = async () => {
    if (!slideForm.heading.trim()) {
      setError("Heading is required");
      return;
    }

    if (!layerForm.content.trim()) {
      setError("Please upload a background image for the slide");
      return;
    }

    try {
      // Create layer from uploaded image
      const layer = {
        id: `layer-${Date.now()}`,
        type: "image",
        content: layerForm.content,
        opacity: 1,
        order: 0,
      };

      const newSlide = {
        id: `slide-${Date.now()}`,
        heading: slideForm.heading,
        subheading: slideForm.subheading,
        layers: [layer],
        ctaButtonText: slideForm.ctaButtonText,
        ctaButtonLink: slideForm.ctaButtonLink,
        order: slides.length,
      };

      const updatedSlides = [...slides, newSlide];
      await updateHeroContent({ slides: updatedSlides });
      setSlides(updatedSlides);
      setSelectedSlideId(newSlide.id);
      setSlideForm({
        heading: "",
        subheading: "",
        ctaButtonText: "",
        ctaButtonLink: "",
      });
      setLayerForm({
        type: "image",
        content: "",
        opacity: 1,
        order: 0,
      });
      setShowSlideForm(false);
      setSuccess("Slide added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add slide");
    }
  };

  // Delete slide
  const handleDeleteSlide = async (slideId) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    try {
      const updatedSlides = slides.filter((s) => s.id !== slideId);
      await updateHeroContent({ slides: updatedSlides });
      setSlides(updatedSlides);
      if (selectedSlideId === slideId) {
        setSelectedSlideId(updatedSlides[0]?.id || null);
      }
      setSuccess("Slide deleted");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete slide");
    }
  };

  // Update slide heading/subheading
  const handleUpdateSlideText = async () => {
    if (!slideForm.heading.trim()) {
      setError("Heading is required");
      return;
    }

    try {
      const updatedSlides = slides.map((s) =>
        s.id === selectedSlideId
          ? {
              ...s,
              heading: slideForm.heading,
              subheading: slideForm.subheading,
              ctaButtonText: slideForm.ctaButtonText,
              ctaButtonLink: slideForm.ctaButtonLink,
            }
          : s,
      );
      await updateHeroContent({ slides: updatedSlides });
      setSlides(updatedSlides);
      setSuccess("Slide text updated");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update slide");
    }
  };

  // Add layer
  const handleAddLayer = async () => {
    if (!layerForm.content.trim()) {
      setError("Please select an image or video");
      return;
    }

    try {
      const newLayer = {
        id: `layer-${Date.now()}`,
        type: layerForm.type,
        content: layerForm.content,
        opacity: parseFloat(layerForm.opacity) || 1,
        order: sortedLayers.length,
      };

      const updatedSlides = slides.map((s) =>
        s.id === selectedSlideId
          ? { ...s, layers: [...(s.layers || []), newLayer] }
          : s,
      );

      await updateHeroContent({ slides: updatedSlides });
      setSlides(updatedSlides);
      setLayerForm({ type: "image", content: "", opacity: 1, order: 0 });
      setShowLayerForm(false);
      setSuccess("Layer added");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add layer");
    }
  };

  // Delete layer
  const handleDeleteLayer = async (layerId) => {
    try {
      const updatedSlides = slides.map((s) =>
        s.id === selectedSlideId
          ? { ...s, layers: (s.layers || []).filter((l) => l.id !== layerId) }
          : s,
      );
      await updateHeroContent({ slides: updatedSlides });
      setSlides(updatedSlides);
      setSuccess("Layer deleted");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete layer");
    }
  };

  // Move layer up/down
  const handleMoveLayer = async (layerId, direction) => {
    try {
      const currentLayers = selectedSlide?.layers || [];
      const layer = currentLayers.find((l) => l.id === layerId);
      if (!layer) return;

      const currentOrder = layer.order;
      const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

      if (newOrder < 0 || newOrder >= currentLayers.length) return;

      const updatedLayers = currentLayers.map((l) => {
        if (l.id === layerId) return { ...l, order: newOrder };
        if (l.order === newOrder) return { ...l, order: currentOrder };
        return l;
      });

      const updatedSlides = slides.map((s) =>
        s.id === selectedSlideId ? { ...s, layers: updatedLayers } : s,
      );

      await updateHeroContent({ slides: updatedSlides });
      setSlides(updatedSlides);
    } catch (err) {
      setError("Failed to move layer");
    }
  };

  // Handle media upload
  const handleMediaUpload = async (e, uploadType) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (uploadType === "image") {
        const url = await uploadImage(file, `hero-layer-${Date.now()}`);
        setLayerForm((prev) => ({ ...prev, content: url, type: "image" }));
        setSuccess("Image uploaded");
      } else if (uploadType === "video") {
        // For now, we'll use the same upload mechanism
        // In production, you might want to use a different service for video
        const url = await uploadImage(file, `hero-video-${Date.now()}`);
        setLayerForm((prev) => ({ ...prev, content: url, type: "video" }));
        setSuccess("Video uploaded");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload media");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "auto",
        gap: "0",
        padding: "0",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <style>{`
        #hero-content-container {
          padding: 2rem;
        }
        @media (min-width: 1024px) {
          #hero-content-container {
            display: flex;
            flex-direction: row;
            height: calc(100vh - 120px);
            gap: 2rem;
          }
          #hero-slides-panel {
            width: 300px;
            border-right: 1px solid #e0e0e0;
            padding-right: 1rem;
          }
          #hero-editor-panel {
            flex: 1;
            overflow-y: auto;
          }
        }
        @media (max-width: 1023px) {
          #hero-content-container {
            display: flex;
            flex-direction: column;
            height: auto;
            gap: 1.5rem;
          }
          #hero-slides-panel {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
            padding-right: 0;
            padding-bottom: 1rem;
          }
          #hero-editor-panel {
            width: 100%;
            overflow-y: auto;
          }
          .hero-slide-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
          }
          .hero-slide-item-content {
            flex: 1;
          }
          .hero-slide-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
          }
          .hero-slide-actions button {
            padding: 0.5rem !important;
            min-width: 36px;
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          #hero-content-container {
            padding: 1rem;
            gap: 1rem;
          }
          #hero-slides-panel {
            padding-bottom: 0.75rem;
          }
          #hero-slides-panel h2 {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }
          .hero-slide-item {
            padding: 0.75rem !important;
            font-size: 0.875rem;
          }
          .hero-slide-item-content > div:first-child {
            font-size: 0.9rem;
          }
          .hero-slide-item-content > div:last-child {
            font-size: 0.75rem;
          }
          .hero-slide-actions button {
            padding: 0.4rem !important;
            min-width: 32px;
            min-height: 32px;
          }
          .hero-slide-actions button svg {
            width: 16px !important;
            height: 16px !important;
          }
        }
        @media (max-width: 480px) {
          #hero-content-container {
            padding: 0.75rem;
            gap: 0.75rem;
          }
          #hero-slides-panel {
            padding-bottom: 0.5rem;
          }
          #hero-slides-panel h2 {
            font-size: 0.95rem !important;
            margin-bottom: 0.5rem !important;
          }
          .new-slide-btn {
            padding: 0.6rem 0.75rem !important;
            font-size: 0.8rem !important;
            min-height: 40px;
          }
          .new-slide-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
          .hero-slide-item {
            padding: 0.5rem !important;
            font-size: 0.8rem;
          }
          .hero-slide-item-content > div:first-child {
            font-size: 0.85rem;
            font-weight: 600;
          }
          .hero-slide-item-content > div:last-child {
            font-size: 0.7rem;
          }
          .hero-slide-actions button {
            padding: 0.35rem !important;
            min-width: 30px;
            min-height: 30px;
          }
          .hero-slide-actions button svg {
            width: 14px !important;
            height: 14px !important;
          }
        }
      `}</style>

      <div id="hero-content-container">
        {/* Left Panel - Slide List */}
        <div
          id="hero-slides-panel"
          style={{
            width: "300px",
            overflowY: "auto",
            borderRight: "1px solid #e0e0e0",
            paddingRight: "1rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Hero Slides
          </h2>

          <button
            onClick={() => {
              setShowSlideForm(true);
              setSlideForm({
                heading: "",
                subheading: "",
                ctaButtonText: "",
                ctaButtonLink: "",
              });
              setLayerForm({
                type: "image",
                content: "",
                opacity: 1,
                order: 0,
              });
            }}
            className="new-slide-btn"
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#c9a227",
              color: "white",
              border: "none",
              borderRadius: "4px",
              marginBottom: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontWeight: "500",
              minHeight: "44px",
              fontSize: "0.9rem",
            }}
          >
            <Plus size={16} /> New Slide
          </button>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="hero-slide-item"
                style={{
                  padding: "1rem",
                  backgroundColor:
                    selectedSlideId === slide.id ? "#f0f0f0" : "white",
                  border: "1px solid #e0e0e0",
                  borderLeft:
                    selectedSlideId === slide.id
                      ? "4px solid #c9a227"
                      : "4px solid transparent",
                  cursor: "pointer",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  className="hero-slide-item-content"
                  onClick={() => {
                    setSelectedSlideId(slide.id);
                    setSlideForm({
                      heading: slide.heading,
                      subheading: slide.subheading,
                      ctaButtonText: slide.ctaButtonText || "",
                      ctaButtonLink: slide.ctaButtonLink || "",
                    });
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                    {slide.heading || "Untitled Slide"}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#666" }}>
                    {(slide.layers || []).length} layers
                  </div>
                </div>
                <div className="hero-slide-actions">
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    style={{
                      padding: "0.5rem",
                      backgroundColor: "#fee2e2",
                      color: "#991b1b",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "36px",
                      minHeight: "36px",
                      transition: "all 0.2s",
                    }}
                    title="Delete slide"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fecaca";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#fee2e2";
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Slide Editor */}
        <div id="hero-editor-panel" style={{ flex: 1, overflowY: "auto" }}>
          {showSlideForm ? (
            /* New Slide Form */
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "2rem",
                borderRadius: "8px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "1.5rem",
                }}
              >
                Create New Slide
              </h2>

              {error && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: "4px",
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gap: "1.5rem" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Heading *
                  </label>
                  <input
                    type="text"
                    value={slideForm.heading}
                    onChange={(e) =>
                      setSlideForm((prev) => ({
                        ...prev,
                        heading: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      fontSize: "1rem",
                    }}
                    placeholder="Main heading"
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
                    Subheading
                  </label>
                  <input
                    type="text"
                    value={slideForm.subheading}
                    onChange={(e) =>
                      setSlideForm((prev) => ({
                        ...prev,
                        subheading: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      fontFamily: "inherit",
                      fontSize: "1rem",
                    }}
                    placeholder="Subheading"
                  />
                </div>

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
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "500",
                      }}
                    >
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={slideForm.ctaButtonText}
                      onChange={(e) =>
                        setSlideForm((prev) => ({
                          ...prev,
                          ctaButtonText: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                      }}
                      placeholder="Button text"
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
                      CTA Button Link
                    </label>
                    <input
                      type="text"
                      value={slideForm.ctaButtonLink}
                      onChange={(e) =>
                        setSlideForm((prev) => ({
                          ...prev,
                          ctaButtonLink: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                      }}
                      placeholder="/appointments"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: "500",
                    }}
                  >
                    Background Image(s) *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaUpload(e, "image")}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginTop: "0.5rem",
                    }}
                  >
                    Upload one or more background images for this slide
                  </p>

                  {layerForm.content && layerForm.type === "image" && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        backgroundColor: "white",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          marginBottom: "0.75rem",
                        }}
                      >
                        Preview:
                      </div>
                      <img
                        src={layerForm.content}
                        alt="Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "150px",
                          borderRadius: "4px",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          marginTop: "0.75rem",
                          display: "flex",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setLayerForm({
                              type: "image",
                              content: "",
                              opacity: 1,
                              order: 0,
                            });
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#f0f0f0",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{ display: "flex", gap: "1rem", paddingTop: "1rem" }}
                >
                  <button
                    onClick={handleAddSlide}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#c9a227",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    <Plus
                      size={16}
                      style={{ display: "inline", marginRight: "0.5rem" }}
                    />
                    Create Slide
                  </button>
                  <button
                    onClick={() => {
                      setShowSlideForm(false);
                      setError("");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#f0f0f0",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : selectedSlide ? (
            <>
              {/* Alert Messages */}
              {error && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: "4px",
                    marginBottom: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{error}</span>
                  <button
                    onClick={() => setError("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#991b1b",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {success && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#dbeafe",
                    color: "#0c4a6e",
                    borderRadius: "4px",
                    marginBottom: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{success}</span>
                  <button
                    onClick={() => setSuccess("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#0c4a6e",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Tab Navigation */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  borderBottom: "2px solid #e0e0e0",
                  marginBottom: "2rem",
                }}
              >
                <button
                  onClick={() => setActiveTab("images")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor:
                      activeTab === "images" ? "#c9a227" : "transparent",
                    color: activeTab === "images" ? "white" : "#666",
                    border: "none",
                    borderBottom:
                      activeTab === "images" ? "3px solid #c9a227" : "none",
                    cursor: "pointer",
                    fontWeight: activeTab === "images" ? "600" : "500",
                    fontSize: "1rem",
                  }}
                >
                  <ImageIcon
                    size={18}
                    style={{ display: "inline", marginRight: "0.5rem" }}
                  />
                  Background Image
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor:
                      activeTab === "text" ? "#c9a227" : "transparent",
                    color: activeTab === "text" ? "white" : "#666",
                    border: "none",
                    borderBottom:
                      activeTab === "text" ? "3px solid #c9a227" : "none",
                    cursor: "pointer",
                    fontWeight: activeTab === "text" ? "600" : "500",
                    fontSize: "1rem",
                  }}
                >
                  Slide Text
                </button>
              </div>

              {/* Tab Content - Images/Backgrounds */}
              {activeTab === "images" && (
                <div
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "1.5rem",
                    borderRadius: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                    }}
                  >
                    Background Image
                  </h3>

                  <div style={{ display: "grid", gap: "1.5rem" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          padding: "1.5rem",
                          border: "2px dashed #c9a227",
                          borderRadius: "4px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <ImageIcon
                          size={32}
                          style={{ margin: "0 auto 0.5rem", color: "#c9a227" }}
                        />
                        <div
                          style={{ fontWeight: "500", marginBottom: "0.25rem" }}
                        >
                          Click to upload background image
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                          PNG, JPG, or GIF (Max 10MB)
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMediaUpload(e, "image")}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {selectedSlide?.layers?.[0]?.content && (
                      <div
                        style={{
                          padding: "1rem",
                          backgroundColor: "white",
                          borderRadius: "4px",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            marginBottom: "0.75rem",
                            color: "#666",
                          }}
                        >
                          Current Image:
                        </div>
                        <img
                          src={selectedSlide.layers[0].content}
                          alt="Slide background"
                          style={{
                            width: "100%",
                            maxHeight: "300px",
                            borderRadius: "4px",
                            objectFit: "cover",
                            marginBottom: "1rem",
                          }}
                        />
                        <button
                          onClick={async () => {
                            try {
                              const updatedSlides = slides.map((s) =>
                                s.id === selectedSlideId
                                  ? {
                                      ...s,
                                      layers: (s.layers || []).filter(
                                        (l) =>
                                          l.id !== selectedSlide.layers[0].id,
                                      ),
                                    }
                                  : s,
                              );
                              await updateHeroContent({
                                slides: updatedSlides,
                              });
                              setSlides(updatedSlides);
                              setSuccess("Image removed");
                              setTimeout(() => setSuccess(""), 3000);
                            } catch (err) {
                              setError("Failed to remove image");
                            }
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "500",
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content - Text/Content */}
              {activeTab === "text" && (
                <div
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "1.5rem",
                    borderRadius: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                    }}
                  >
                    Slide Text (Bottom Content)
                  </h3>

                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: "500",
                        }}
                      >
                        Heading *
                      </label>
                      <input
                        type="text"
                        value={slideForm.heading}
                        onChange={(e) =>
                          setSlideForm((prev) => ({
                            ...prev,
                            heading: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          fontFamily: "inherit",
                          fontSize: "1rem",
                        }}
                        placeholder="Main heading"
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
                        Subheading
                      </label>
                      <input
                        type="text"
                        value={slideForm.subheading}
                        onChange={(e) =>
                          setSlideForm((prev) => ({
                            ...prev,
                            subheading: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          fontFamily: "inherit",
                          fontSize: "1rem",
                        }}
                        placeholder="Subheading"
                      />
                    </div>

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
                            display: "block",
                            marginBottom: "0.5rem",
                            fontWeight: "500",
                          }}
                        >
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={slideForm.ctaButtonText}
                          onChange={(e) =>
                            setSlideForm((prev) => ({
                              ...prev,
                              ctaButtonText: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                          }}
                          placeholder="Button text"
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
                          CTA Button Link
                        </label>
                        <input
                          type="text"
                          value={slideForm.ctaButtonLink}
                          onChange={(e) =>
                            setSlideForm((prev) => ({
                              ...prev,
                              ctaButtonLink: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                          }}
                          placeholder="/appointments"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateSlideText}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#c9a227",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      Save Text Changes
                    </button>

                    <button
                      onClick={() => handleDeleteSlide(selectedSlideId)}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      <Trash2
                        size={16}
                        style={{ display: "inline", marginRight: "0.5rem" }}
                      />
                      Delete Slide
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{ textAlign: "center", color: "#999", padding: "2rem" }}
            >
              <p>Create a new slide to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroContentAdvanced;
