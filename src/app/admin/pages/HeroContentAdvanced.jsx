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

    try {
      const newSlide = {
        id: `slide-${Date.now()}`,
        heading: slideForm.heading,
        subheading: slideForm.subheading,
        layers: [],
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
        height: "calc(100vh - 120px)",
        gap: "2rem",
        padding: "2rem",
      }}
    >
      {/* Left Panel - Slide List */}
      <div
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
          }}
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
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                {slide.heading || "Untitled Slide"}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                {(slide.layers || []).length} layers
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Slide Editor */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {selectedSlide ? (
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

            {/* Slide Text Editor */}
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                border: "1px solid #c9a227",
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

            {/* Layers Editor */}
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
                Background Layers ({sortedLayers.length})
              </h3>

              <button
                onClick={() => {
                  setShowLayerForm(!showLayerForm);
                  setLayerForm({
                    type: "image",
                    content: "",
                    opacity: 1,
                    order: 0,
                  });
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#f0f0f0",
                  border: "2px dashed #c9a227",
                  borderRadius: "4px",
                  marginBottom: "1.5rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Plus size={16} /> Add Layer
              </button>

              {showLayerForm && (
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "1.5rem",
                    borderRadius: "4px",
                    border: "1px solid #c9a227",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h4 style={{ fontWeight: "600", marginBottom: "1rem" }}>
                    New Layer
                  </h4>

                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: "500",
                        }}
                      >
                        Layer Type *
                      </label>
                      <select
                        value={layerForm.type}
                        onChange={(e) =>
                          setLayerForm((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                        }}
                      >
                        <option value="image">Background Image</option>
                        <option value="video">Video</option>
                        <option value="color">Solid Color</option>
                      </select>
                    </div>

                    {layerForm.type === "image" && (
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
                            size={24}
                            style={{ margin: "0 auto 0.5rem" }}
                          />
                          <div style={{ fontWeight: "500" }}>
                            Click to upload image
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleMediaUpload(e, "image")}
                            style={{ display: "none" }}
                          />
                        </label>
                        {layerForm.content && (
                          <div style={{ marginTop: "0.75rem" }}>
                            <img
                              src={layerForm.content}
                              alt="Preview"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "200px",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {layerForm.type === "video" && (
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
                          <VideoIcon
                            size={24}
                            style={{ margin: "0 auto 0.5rem" }}
                          />
                          <div style={{ fontWeight: "500" }}>
                            Click to upload video
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleMediaUpload(e, "video")}
                            style={{ display: "none" }}
                          />
                        </label>
                        {layerForm.content && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              fontSize: "0.875rem",
                              color: "#666",
                            }}
                          >
                            Video uploaded: {layerForm.content.split("/").pop()}
                          </div>
                        )}
                      </div>
                    )}

                    {layerForm.type === "color" && (
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.5rem",
                            fontWeight: "500",
                          }}
                        >
                          Color *
                        </label>
                        <input
                          type="color"
                          value={layerForm.content || "#000000"}
                          onChange={(e) =>
                            setLayerForm((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            height: "50px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    )}

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          fontWeight: "500",
                        }}
                      >
                        Opacity: {layerForm.opacity}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layerForm.opacity}
                        onChange={(e) =>
                          setLayerForm((prev) => ({
                            ...prev,
                            opacity: parseFloat(e.target.value),
                          }))
                        }
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={handleAddLayer}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          backgroundColor: "#c9a227",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        Add Layer
                      </button>
                      <button
                        onClick={() => setShowLayerForm(false)}
                        style={{
                          flex: 1,
                          padding: "0.75rem",
                          backgroundColor: "#f0f0f0",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Layers List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {sortedLayers.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#999",
                      padding: "2rem",
                    }}
                  >
                    No layers yet. Click "Add Layer" to start.
                  </div>
                ) : (
                  sortedLayers.map((layer, index) => (
                    <div
                      key={layer.id}
                      style={{
                        padding: "1rem",
                        backgroundColor: "white",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ color: "#999", fontWeight: "600" }}>
                        Layer {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500" }}>
                          {layer.type === "image" && "📷 Image"}
                          {layer.type === "video" && "🎬 Video"}
                          {layer.type === "color" && "🎨 Color"}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>
                          Opacity: {layer.opacity}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMoveLayer(layer.id, "up")}
                        disabled={index === 0}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: index === 0 ? "#f0f0f0" : "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                          opacity: index === 0 ? 0.5 : 1,
                        }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveLayer(layer.id, "down")}
                        disabled={index === sortedLayers.length - 1}
                        style={{
                          padding: "0.5rem",
                          backgroundColor:
                            index === sortedLayers.length - 1
                              ? "#f0f0f0"
                              : "white",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          cursor:
                            index === sortedLayers.length - 1
                              ? "not-allowed"
                              : "pointer",
                          opacity: index === sortedLayers.length - 1 ? 0.5 : 1,
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteLayer(layer.id)}
                        style={{
                          padding: "0.5rem",
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", color: "#999", padding: "2rem" }}>
            <p>Create a new slide to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroContentAdvanced;
