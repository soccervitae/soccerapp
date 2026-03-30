

## Problem

In PWA mode, headers are hidden behind the device status bar (signal, wifi, battery icons) because:
1. `apple-mobile-web-app-status-bar-style` is set to `black-translucent` — this makes the app render **behind** the status bar
2. `viewport-fit=cover` extends the viewport into the safe area
3. The `padding-top: 50px` CSS hack is a fixed value that doesn't match all devices and doesn't properly solve the overlay issue

In the browser, the browser chrome naturally pushes content below the status bar — that's why it works there.

## Solution

Change the PWA to behave like the browser: content always starts **below** the status bar.

### Changes

1. **`index.html`** — Change status bar style from `black-translucent` to `default`
   - This tells iOS to render a solid status bar above the app content instead of overlaying it
   - The status bar will use the `theme-color` (#426F42) as background

2. **`src/index.css`** — Remove the `@media (display-mode: standalone)` padding hack entirely since it's no longer needed

This is a 2-file change. No component files need editing — the headers already have proper `bg-background/95` and `backdrop-blur` styling that will work correctly once the status bar stops overlapping.

### Technical detail

- `black-translucent`: status bar is transparent, content renders behind it → requires manual safe-area padding
- `default`: status bar is opaque, content starts below it → just like the browser, no padding needed

