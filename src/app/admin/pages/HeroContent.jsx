import { useState, useEffect } from "react";
import { Edit, Plus, Trash2, GripVertical } from "lucide-react";
import {
  getHeroContent,
  updateHeroContent,
  uploadImage,
} from "../services/contentService";

const HeroContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [slides, setSlides] = useState([]);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [editingSlide, setEditingSlide] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadHeroContent();
  }, []);

  const loadHeroContent = async () => {
    try {
      setIsLoading(true);
      const hero = await getHeroContent();
      if (hero && hero.slides) {
        const sortedSlides = [...hero.slides].sort((a, b) => a.order - b.order);
        setSlides(sortedSlides);
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

  const handleImageUpload = async (e, slideIndex) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await uploadImage(file, `hero-${slideIndex}`);
      if (editingSlideId) {
        setEditingSlide((prev) => ({ ...prev, image: url }));
      } else {
        // For new slide
        setEditingSlide((prev) => ({ ...prev, image: url }));
      }
      setSuccess("Image uploaded successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload image");
      console.error(err);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleAddSlide = () => {
    setEditingSlide({
      id: `slide-${Date.now()}`,
      title: "",
      subtitle: "",
      image: "",
      ctaButtonText: "",
      ctaButtonLink: "",
      order: slides.length,
    });
    setIsAddingNew(true);
  };

  const handleEditSlide = (slide) => {
    setEditingSlide({ ...slide });
    setEditingSlideId(slide.id);
  };

  const handleSaveSlide = async () => {
    try {
      if (
        !editingSlide.title ||
        !editingSlide.subtitle ||
        !editingSlide.image
      ) {
        setError("Please fill all required fields (title, subtitle, image)");
        return;
      }

      let updatedSlides;
      if (isAddingNew) {
        updatedSlides = [...slides, editingSlide];
      } else {
        updatedSlides = slides.map((s) =>
          s.id === editingSlideId ? editingSlide : s,
        );
      }

      // Ensure all have correct order
      updatedSlides = updatedSlides.map((s, idx) => ({ ...s, order: idx }));
      setSlides(updatedSlides);

      await updateHeroContent({ slides: updatedSlides });
      setSuccess(
        isAddingNew ? "Slide added successfully" : "Slide updated successfully",
      );
      setEditingSlide(null);
      setEditingSlideId(null);
      setIsAddingNew(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save slide");
      console.error(err);
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;

    try {
      const updatedSlides = slides
        .filter((s) => s.id !== slideId)
        .map((s, idx) => ({ ...s, order: idx }));
      setSlides(updatedSlides);
      await updateHeroContent({ slides: updatedSlides });
      setSuccess("Slide deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete slide");
      console.error(err);
    }
  };

  const handleMoveSlide = (draggedId, targetId) => {
    const draggedIndex = slides.findIndex((s) => s.id === draggedId);
    const targetIndex = slides.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSlides = [...slides];
    [newSlides[draggedIndex], newSlides[targetIndex]] = [
      newSlides[targetIndex],
      newSlides[draggedIndex],
    ];
    newSlides.forEach((s, idx) => (s.order = idx));
    setSlides(newSlides);
    updateHeroContent({ slides: newSlides }).catch((err) => {
      console.error("Error reordering slides:", err);
      setError("Failed to reorder slides");
    });
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <div
          className="loading-spinner"
          style={{ width: 40, height: 40, borderWidth: 3 }}
        ></div>
      </div>
    );
  }

  return (
    <div>
      {/* Alerts */}
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

      {editingSlide ? (
        // Edit/Add Slide Form
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {isAddingNew ? "Add New Hero Slide" : "Edit Hero Slide"}
            </h2>
          </div>
          <div className="card-content">
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
                  className="input"
                  value={editingSlide.title}
                  onChange={(e) =>
                    setEditingSlide({ ...editingSlide, title: e.target.value })
                  }
                  placeholder="e.g., Where Luxury Meets Beauty"
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
                  Subtitle *
                </label>
                <textarea
                  className="input"
                  style={{ minHeight: "100px", resize: "vertical" }}
                  value={editingSlide.subtitle}
                  onChange={(e) =>
                    setEditingSlide({
                      ...editingSlide,
                      subtitle: e.target.value,
                    })
                  }
                  placeholder="e.g., Experience world-class beauty and wellness treatments"
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
                  Hero Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, editingSlide.order)}
                  className="input"
                  style={{ cursor: "pointer" }}
                />
                {editingSlide.image && (
                  <div style={{ marginTop: "1rem", position: "relative" }}>
                    <img
                      src={editingSlide.image}
                      alt="Hero preview"
                      style={{
                        maxWidth: "300px",
                        maxHeight: "200px",
                        borderRadius: "var(--admin-radius-sm)",
                        border: "1px solid var(--admin-border)",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginTop: "0.5rem",
                      }}
                    >
                      Image uploaded:{" "}
                      {editingSlide.image.length > 50 ? "✓" : ""}
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
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
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editingSlide.ctaButtonText || ""}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        ctaButtonText: e.target.value,
                      })
                    }
                    placeholder="e.g., Schedule Now"
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
                    CTA Button Link
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={editingSlide.ctaButtonLink || ""}
                    onChange={(e) =>
                      setEditingSlide({
                        ...editingSlide,
                        ctaButtonLink: e.target.value,
                      })
                    }
                    placeholder="e.g., /appointments"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", paddingTop: "1rem" }}>
                <button
                  type="button"
                  onClick={handleSaveSlide}
                  className="btn btn-primary"
                >
                  {isAddingNew ? "Add Slide" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSlide(null);
                    setEditingSlideId(null);
                    setIsAddingNew(false);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // Slides List
        <div className="card">
          <div
            className="card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 className="card-title">
              Hero Carousel Slides ({slides.length})
            </h2>
            <button
              onClick={handleAddSlide}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Plus size={18} /> Add Slide
            </button>
          </div>
          <div className="card-content">
            {slides.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "var(--admin-muted-foreground)",
                }}
              >
                <p>No slides yet. Create your first hero slide!</p>
                <button
                  onClick={handleAddSlide}
                  className="btn btn-primary"
                  style={{ marginTop: "1rem" }}
                >
                  <Plus size={18} /> Create First Slide
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {slides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    draggable
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = e.dataTransfer.getData("text/plain");
                      if (draggedId !== slide.id)
                        handleMoveSlide(draggedId, slide.id);
                    }}
                    style={{
                      padding: "1.5rem",
                      border: "1px solid var(--admin-border)",
                      borderRadius: "var(--admin-radius-sm)",
                      display: "grid",
                      gridTemplateColumns: "40px 1fr 200px auto",
                      gap: "1rem",
                      alignItems: "center",
                      backgroundColor: "var(--admin-accent)",
                      transition: "all 0.2s",
                    }}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", slide.id)
                    }
                  >
                    {/* Drag Handle */}
                    <div
                      style={{
                        cursor: "grab",
                        color: "var(--admin-muted-foreground)",
                      }}
                    >
                      <GripVertical size={20} />
                    </div>

                    {/* Slide Info */}
                    <div>
                      <p
                        style={{
                          fontWeight: "600",
                          color: "var(--admin-foreground)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Slide {idx + 1}: {slide.title}
                      </p>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--admin-muted-foreground)",
                        }}
                      >
                        {slide.subtitle.substring(0, 50)}...
                      </p>
                    </div>

                    {/* Image Thumbnail */}
                    {slide.image && (
                      <img
                        src={slide.image}
                        alt={slide.title}
                        style={{
                          maxWidth: "100%",
                          height: "80px",
                          borderRadius: "var(--admin-radius-sm)",
                          objectFit: "cover",
                          border: "1px solid var(--admin-border)",
                        }}
                      />
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleEditSlide(slide)}
                        className="btn btn-secondary"
                        style={{
                          padding: "0.5rem 1rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="btn"
                        style={{
                          padding: "0.5rem 0.75rem",
                          backgroundColor: "rgba(220, 38, 38, 0.1)",
                          color: "#dc2626",
                          border: "1px solid #dc2626",
                          borderRadius: "var(--admin-radius-sm)",
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
      )}
    </div>
  );
};

export default HeroContent;
