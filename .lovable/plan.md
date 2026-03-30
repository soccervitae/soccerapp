

## Plan: Generate professional hero banner image for Landing Page

### What will be done
Use the AI image generation API to create a professional soccer hero banner image inspired by the reference image (player doing a bicycle kick with dark cinematic tones), then replace the current `hero-players-night.jpg` used in the Landing page hero section.

### Steps

**1. Generate the image** using Nano banana 2 (google/gemini-3.1-flash-image-preview)
- Prompt: A cinematic, professional soccer/football hero banner. A player in white kit performing a spectacular bicycle kick against a dark moody background with dramatic lighting. Dark gray/charcoal tones with subtle green accents. Wide aspect ratio (16:9), high contrast, editorial sports photography style. No text overlay.
- Save the generated image to `src/assets/hero-banner-professional.jpg`

**2. Update `src/pages/Landing.tsx`**
- Replace the `heroPlayersNight` import with the new image
- Update the `<img>` tag in the hero section to use the new asset

### Files
- `src/assets/hero-banner-professional.jpg` (new, generated)
- `src/pages/Landing.tsx` (update import)

