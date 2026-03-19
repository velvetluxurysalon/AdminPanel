import { Edit } from "lucide-react";
import { TextInput, TextAreaInput, ImageUploadInput } from "../components";

export const HeroSection = ({
  activeTab,
  heroForm,
  setHeroForm,
  editingHero,
  setEditingHero,
  handleImageUpload,
  handleUpdateHeroContent,
}) => {
  if (activeTab !== "hero") return null;

  return (
    <div id="hero" style={{ padding: "clamp(0.75rem, 5vw, 2rem)" }}>
      <div className="section-container">
        {editingHero ? (
          <div className="form-container">
            <h2
              style={{
                marginBottom: "1rem",
                fontSize: "clamp(1rem, 5vw, 1.5rem)",
              }}
            >
              Edit Hero Section
            </h2>
            <TextInput
              label="Title"
              value={heroForm.title}
              onChange={(e) =>
                setHeroForm({ ...heroForm, title: e.target.value })
              }
              placeholder="Enter hero title"
            />
            <TextAreaInput
              label="Subtitle"
              value={heroForm.subtitle}
              onChange={(e) =>
                setHeroForm({ ...heroForm, subtitle: e.target.value })
              }
              placeholder="Enter hero subtitle"
            />
            <ImageUploadInput
              label="Hero Image"
              value={heroForm.image}
              onChange={(e) => handleImageUpload(e, "image", setHeroForm)}
            />
            <TextInput
              label="CTA Button Text"
              value={heroForm.ctaButtonText}
              onChange={(e) =>
                setHeroForm({ ...heroForm, ctaButtonText: e.target.value })
              }
            />
            <TextInput
              label="CTA Button Link"
              value={heroForm.ctaButtonLink}
              onChange={(e) =>
                setHeroForm({ ...heroForm, ctaButtonLink: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateHeroContent}
                className="btn btn-primary"
              >
                Save
              </button>
              <button
                onClick={() => setEditingHero(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setEditingHero(true)}
              className="btn btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding:
                  "clamp(0.65rem, 3vw, 0.75rem) clamp(1rem, 4vw, 1.5rem)",
                minHeight: "40px",
              }}
            >
              <Edit size={20} /> Edit Hero Section
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
