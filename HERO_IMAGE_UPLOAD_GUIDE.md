# Hero Image Upload Feature - Complete Guide

## Overview

The hero section in the admin panel now supports proper image uploads with a layer-based architecture. Each hero slide can have multiple images that are properly stored and fetched by the frontend.

## Features Added

### 1. **Enhanced Image Upload**

- Upload hero images directly in the admin panel
- Multiple images per slide supported (as layers)
- Instant image preview in admin panel
- Visual thumbnail in slide list

### 2. **Layer-Based Architecture**

- Each image is stored as a `HeroLayer` object with:
  - `id`: Unique identifier
  - `type`: "image" (string)
  - `content`: Firebase Storage URL
  - `opacity`: Transparency level (0-1)
  - `order`: Z-index for layering

### 3. **Backward Compatibility**

- Legacy slides with single image property are automatically converted
- Frontend handles both old and new formats seamlessly
- No migration needed for existing data

## How to Use

### Adding a New Hero Slide

1. **Go to Admin Panel** → Navigate to Hero Section
2. **Click "Add Slide"** button
3. **Fill in the details:**
   - Title (required)
   - Subtitle (required)
   - Upload Hero Image(s) (required)
   - CTA Button Text (optional)
   - CTA Button Link (optional)
4. **Click "Add Slide"** to save

### Uploading Images to a Slide

1. **Click "Edit"** on an existing slide or create a new one
2. **Choose image file** in the "Hero Image(s)" section
3. **Image will be uploaded** to Firebase Storage
4. **Image preview appears** in the gallery below
5. **You can add multiple images** - each will be a separate layer
6. **Remove images** by clicking the × button on any image thumbnail

### Editing an Existing Slide

1. **Click "Edit"** on the slide
2. **Modify text fields** (title, subtitle, CTA)
3. **Add more images** or remove existing ones
4. **Click "Save Changes"**

### Reordering Slides

1. **Drag slides** using the grip handle (six dots icon)
2. **Drop on new position** - order updates automatically
3. **Saves to database** immediately

## Data Structure

### HeroSlide Object

```javascript
{
  id: "slide-1709234567890",
  title: "Where Luxury Meets Beauty",
  subtitle: "Experience world-class treatments",
  heading: "Where Luxury Meets Beauty",        // New format
  subheading: "Experience world-class treatments", // New format
  image: "https://firebase-url.com/image.jpg", // Legacy support
  layers: [                                      // New format
    {
      id: "layer-1",
      type: "image",
      content: "https://firebase-url.com/image.jpg",
      opacity: 1,
      order: 0
    }
  ],
  ctaButtonText: "Schedule Now",
  ctaButtonLink: "/appointments",
  order: 0,
  updatedAt: "2024-03-14T10:30:00Z"
}
```

## Frontend Display

### How Images Display on Frontend

The frontend `HeroCarousel.tsx` component:

1. **Fetches hero content** from Firebase
2. **Automatically converts** old format to new format
3. **Sorts layers** by order (z-index)
4. **Renders layers** as background images with styling:
   - Full-screen background
   - Center-aligned
   - Cover sizing
   - Parallax effect on desktop

### Image Display Flow

```
Admin Upload
    ↓
Convert to HeroLayer
    ↓
Save to Firebase (websiteContent/hero)
    ↓
Frontend fetches data
    ↓
Normalize to HeroSlide format
    ↓
HeroCarousel renders with background image
```

## Technical Details

### Upload Location

- **Firebase Storage Path**: `websiteContent/hero-{slideIndex}/{timestamp}_{filename}`
- **Database Path**: `websiteContent/hero` document

### Image Requirements

- **Supported Formats**: JPG, PNG, WebP, GIF
- **Recommended Size**: 1920x1080px (Full HD)
- **Recommended File Size**: < 2MB for optimal loading
- **Aspect Ratio**: 16:9 (widescreen)

### Validation

- **Title**: Required, non-empty
- **Subtitle**: Required, non-empty
- **Image**: At least one image required (in layers or legacy format)

## Troubleshooting

### Images Not Showing on Frontend

**Check 1: Verify Upload Success**

- Look for green success message in admin panel
- Check image appears in thumbnail gallery

**Check 2: Firebase Connection**

- Verify Firebase configuration in both admin and frontend
- Check Firebase Storage rules allow read access

**Check 3: Browser Cache**

- Hard refresh (Ctrl+Shift+R)
- Clear browser cache
- Try incognito mode

### Upload Fails with Error

**Common Causes:**

1. File too large - compress image to < 2MB
2. Firebase Storage quota exceeded - check Firebase console
3. Network timeout - retry or split into smaller uploads

### Multiple Images Don't Display as Expected

**Solution:**

- Images overlap by design (last layer on top)
- Use opacity settings to create layering effect
- Open browser DevTools to inspect rendered HTML

## API Functions (For Developers)

### In Admin Service

```typescript
// Upload image to Firebase Storage
uploadImage(file: File, folder: string): Promise<string>

// Get all hero slides
getHeroContent(): Promise<HeroContent | null>

// Update hero content with slides
updateHeroContent(content: HeroContent): Promise<void>

// Add single slide
addHeroSlide(slide: Omit<HeroSlide, "id">): Promise<void>

// Update single slide
updateHeroSlide(slideId: string, slide: Partial<HeroSlide>): Promise<void>

// Delete single slide
deleteHeroSlide(slideId: string): Promise<void>
```

### In Frontend Service

```typescript
// Get hero content (auto-normalizes format)
getHeroContent(): Promise<HeroContent | null>
```

## Firebase Security Rules

Ensure Firebase has proper rules for hero images:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /websiteContent/hero-* {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Best Practices

1. **Use High-Quality Images**
   - Minimum 1440px wide
   - Compressed to 1-2MB
   - High resolution for retina displays

2. **Maintain Consistency**
   - Same aspect ratio for all slides
   - Similar color tones for smooth transitions
   - Aligned text placement

3. **Mobile Optimization**
   - Images scale responsively
   - Text remains readable on mobile
   - Avoid text in bottom 20% (controls area)

4. **Performance**
   - Lazy load images
   - Use WebP format if supported
   - Compress images before upload

## Recent Changes

### v2.0 Updates (Current)

- ✅ Layer-based image storage
- ✅ Multiple images per slide support
- ✅ Improved admin UI with image gallery
- ✅ Backward compatibility with legacy format
- ✅ Enhanced image preview and management
- ✅ Better error handling and validation

### v1.0 (Legacy)

- Single image per slide
- Basic image upload
- No layer support

## Support

For issues or feature requests:

1. Check this guide first
2. Verify Firebase configuration
3. Review console logs for errors
4. Check Firebase Storage quota and permissions
