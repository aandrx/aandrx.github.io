# Image Integration Strategy for Public Repository

## Overview
This document explains how to integrate Cloudflare R2-hosted images into this Next.js public repository (`aandrx.github.io`) after completing Phase 1 and 2 setup.

---

## Current Status
**Completed:**
- Phase 1: Cloudflare R2 bucket created with API credentials and custom domain
- Phase 2: Private repository with image processing pipeline and GitHub Actions automation

**Next Steps:**
- Phase 3: Update this public repository to reference R2-hosted images

---

## Part 1: Understanding Image References from R2 Bucket

### How Images Are Stored in R2 Bucket

After your GitHub Actions workflow runs, your R2 bucket will have this flat structure:

```
cloudflare-r2://portfolio-resources/
├── photowalks-2024-08-31/         # Folder-based organization
│   ├── DSCF6207-720w.webp         # Small size (720px width, ~31KB)
│   ├── DSCF6207-1920w.webp        # Large size (1920px width, ~145KB)
│   ├── DSCF6208-720w.webp
│   ├── DSCF6208-1920w.webp
│   └── DSCF6209-720w.webp
├── new-comer-2023/
│   ├── IMG_0001-720w.webp
│   ├── IMG_0001-1920w.webp
│   ├── IMG_0002-720w.webp
│   └── IMG_0002-1920w.webp
├── printsubs/
│   ├── DSCF6171-720w.webp
│   ├── DSCF6171-1920w.webp
│   ├── DSC00210-720w.webp
│   └── DSC00210-1920w.webp
└── about/
    ├── profile-photo-720w.webp
    └── profile-photo-1920w.webp
```

**Important:** The R2 bucket contains ONLY optimized WebP files, organized by folder name directly at the root level.

### Where Original High-Res Images Are Stored

```
PRIVATE REPOSITORY (portfolio-images) - NOT uploaded to R2:
└── images/                             # Original high-res photos (secure)
    ├── photowalks-2024-08-31/         # Organized by event-date
    │   ├── DSCF6207.jpg               # Original file
    │   ├── DSCF6208.jpg
    │   └── DSCF6209.jpg
    ├── new-comer-2023/
    │   ├── IMG_0001.tiff
    │   └── IMG_0002.tiff
    └── about/
        └── profile-photo.psd
```

**Important Security Note:** 
- Original high-res images (`images/` folder) are **NEVER** uploaded to R2 bucket
- Only optimized WebP files (`optimized/` folder) are uploaded to R2 via GitHub Actions
- Your high-quality source files remain secure in the private repository only

### How to Reference These Images via CDN

Your optimized images are accessible through Cloudflare CDN using this URL pattern:

```
https://cdn.yoursite.com/{folder-name}/{image-name}-{size}w.webp
```

**Real Examples:**

| Original File | CDN URL (720w) | CDN URL (1920w) |
|--------------|----------------|-----------------|
| `images/printsubs/DSCF6171.jpg` | `https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp` | `https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp` |
| `images/photowalks-2024-08-31/DSCF6207.jpg` | `https://cdn.yoursite.com/photowalks-2024-08-31/DSCF6207-720w.webp` | `https://cdn.yoursite.com/photowalks-2024-08-31/DSCF6207-1920w.webp` |
| `images/new-comer-2023/IMG_0001.tiff` | `https://cdn.yoursite.com/new-comer-2023/IMG_0001-720w.webp` | `https://cdn.yoursite.com/new-comer-2023/IMG_0001-1920w.webp` |

**How the CDN Works:**

1. **Browser requests:** `https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp`
2. **Cloudflare CDN checks:** Is this cached on a nearby edge server?
   - **YES:** Serves from cache instantly (< 50ms)
   - **NO:** Fetches from R2 bucket, caches it, then serves it
3. **Subsequent requests:** Served from cache globally (300+ locations)

**Important Notes:**
- CDN URLs map directly to R2 bucket structure: `{folder-name}/{filename}-{size}w.webp`
- Original high-res images stay in private repository only
- Only Sharp-processed WebP files (720w, 1920w) are in R2 bucket
- Zero egress fees thanks to Cloudflare R2 + CDN integration

---

## Part 2: Proposed Structure for This Repository

### Directory Structure

We'll create a centralized image management system in this public repository:

```
aandrx.github.io/
├── src/
│   ├── config/
│   │   ├── images.config.ts          # Main configuration file
│   │   └── cdn.config.ts             # CDN URL helpers
│   ├── data/
│   │   ├── image-manifest.json       # Complete image inventory
│   │   └── project-images.json       # Project-specific images
│   ├── lib/
│   │   ├── getImageUrl.ts            # Utility to generate CDN URLs
│   │   └── imageOptimizer.ts         # Helper for srcset/responsive images
│   ├── components/
│   │   ├── OptimizedImage.tsx        # Wrapper component for images
│   │   └── ResponsiveImage.tsx       # Responsive image component
│   └── app/
│       └── ... (existing pages)
├── public/
│   └── image-references/             # NEW: Local reference system
│       ├── README.md                 # Documentation of reference system
│       ├── about.json                # About page image references
│       ├── home.json                 # Home page image references
│       ├── contact.json              # Contact page image references
│       ├── events/                   # Event-based photo collections
│       │   ├── photowalks-2024-08-31.json
│       │   ├── new-comer-2023.json
│       │   └── exhibition-2024.json
│       ├── projects/                 # Project-specific image collections
│       │   ├── project-one.json      # "New Comer" series
│       │   ├── project-two.json
│       │   ├── project-three.json
│       │   ├── project-four.json
│       │   ├── project-five.json
│       │   └── project-six.json
│       └── global.json               # Global images (logo, placeholders)
└── next.config.js                     # Updated with CDN domain
```

---

## Part 3: Detailed Implementation Plan

### Step 1: Configuration Files

#### `src/config/cdn.config.ts`
```typescript
// CDN Configuration
export const CDN_CONFIG = {
  baseUrl: 'https://cdn.yoursite.com', // Your custom R2 CDN domain
  bucketName: 'portfolio-resources',
  fallbackUrl: '/placeholder.jpg', // Local fallback if CDN fails
  
  // Optional: Different CDN environments
  production: 'https://cdn.yoursite.com',
  staging: 'https://staging-cdn.yoursite.com',
  development: 'http://localhost:3000/dev-images', // Local testing
}

// Get the appropriate CDN URL based on environment
export function getCdnBaseUrl(): string {
  const env = process.env.NODE_ENV
  if (env === 'production') return CDN_CONFIG.production
  if (env === 'staging') return CDN_CONFIG.staging
  return CDN_CONFIG.development
}

// Generate full CDN URL from folder and filename
// Example: getImageCdnUrl('printsubs', 'DSCF6171', '1920w')
// Returns: 'https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp'
export function getImageCdnUrl(folder: string, filename: string, size: '720w' | '1920w'): string {
  const baseUrl = getCdnBaseUrl()
  return `${baseUrl}/${folder}/${filename}-${size}.webp`
}
```

#### `src/config/images.config.ts`
```typescript
import { getCdnBaseUrl, getImageCdnUrl } from './cdn.config'

// Available sizes from your Sharp processing pipeline
export const IMAGE_SIZES = {
  small: '720w',   // ~31KB - mobile/tablet
  large: '1920w',  // ~145KB - desktop/retina
} as const

// Image quality settings (set during Sharp processing)
export const IMAGE_QUALITY = {
  default: 80, // Your Sharp setting
}

// Helper to build full image URL from folder/filename
// Example: buildImageUrl('printsubs/DSCF6171-1920w.webp')
// Returns: 'https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp'
export function buildImageUrl(path: string): string {
  const baseUrl = getCdnBaseUrl()
  return `${baseUrl}/${path}`
}

// Helper to build srcset for responsive images
// Example: buildImageSrcSet('printsubs', 'DSCF6171')
// Returns: 'https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp 720w, https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp 1920w'
export function buildImageSrcSet(folder: string, filename: string): string {
  return `${getImageCdnUrl(folder, filename, '720w')} 720w, ${getImageCdnUrl(folder, filename, '1920w')} 1920w`
}
```

---

### Step 2: Image Reference JSON Files

#### `public/image-references/about.json`
```json
{
  "page": "about",
  "lastUpdated": "2025-10-02",
  "cdnBase": "https://cdn.yoursite.com",
  "images": {
    "hero": {
      "originalFilename": "profile-photo.psd",
      "sourceFolder": "about",
      "baseFilename": "profile-photo",
      "path": "about/profile-photo-1920w.webp",
      "alt": "About Andrew Liu - Professional Portrait",
      "width": 760,
      "height": 305,
      "sizes": {
        "small": "about/profile-photo-720w.webp",
        "large": "about/profile-photo-1920w.webp"
      },
      "aspectRatio": "2.49:1"
    }
  }
}
```

**CDN URL Pattern:**
```tsx
// CDN URL follows this pattern:
// https://cdn.yoursite.com/{folder}/{filename}-{size}w.webp
// Example: https://cdn.yoursite.com/about/profile-photo-1920w.webp
```

#### `public/image-references/projects/project-one.json`
```json
{
  "projectId": "project-one",
  "projectName": "New Comer",
  "sourceFolder": "new-comer-2023",
  "lastUpdated": "2025-10-02",
  "cdnBase": "https://cdn.yoursite.com",
  "description": "Photography series exploring the experiences of young people moving to new cities",
  "images": [
    {
      "id": "img-1",
      "originalFilename": "IMG_0001.tiff",
      "baseFilename": "IMG_0001",
      "sourceFolder": "new-comer-2023",
      "path": "new-comer-2023/IMG_0001-1920w.webp",
      "alt": "New Comer series - Portrait of young professional in Hangzhou",
      "width": 1920,
      "height": 1280,
      "order": 1,
      "category": "main",
      "location": "Hangzhou, China",
      "captureDate": "2023-05-15",
      "sizes": {
        "small": "new-comer-2023/IMG_0001-720w.webp",
        "large": "new-comer-2023/IMG_0001-1920w.webp"
      },
      "aspectRatio": "3:2"
    },
    {
      "id": "img-2",
      "originalFilename": "IMG_0002.tiff",
      "baseFilename": "IMG_0002",
      "sourceFolder": "new-comer-2023",
      "path": "new-comer-2023/IMG_0002-1920w.webp",
      "alt": "New Comer series - Environmental portrait in urban setting",
      "width": 1920,
      "height": 1280,
      "order": 2,
      "category": "main",
      "location": "Shanghai, China",
      "captureDate": "2023-06-22",
      "sizes": {
        "small": "new-comer-2023/IMG_0002-720w.webp",
        "large": "new-comer-2023/IMG_0002-1920w.webp"
      },
      "aspectRatio": "3:2"
    }
  ]
}
```

**CDN URL Examples:**
```tsx
// Desktop (large): https://cdn.yoursite.com/new-comer-2023/IMG_0001-1920w.webp (~145KB)
// Mobile (small): https://cdn.yoursite.com/new-comer-2023/IMG_0001-720w.webp (~31KB)
```

#### `public/image-references/events/photowalks-2024-08-31.json`
```json
{
  "eventId": "photowalks-2024-08-31",
  "eventName": "Photo Walk - August 31, 2024",
  "sourceFolder": "photowalks-2024-08-31",
  "eventDate": "2024-08-31",
  "location": "Hangzhou, China",
  "lastUpdated": "2025-10-02",
  "cdnBase": "https://cdn.yoursite.com",
  "description": "Street photography from evening photo walk in West Lake district",
  "images": [
    {
      "id": "photowalk-1",
      "originalFilename": "DSCF6207.jpg",
      "baseFilename": "DSCF6207",
      "sourceFolder": "photowalks-2024-08-31",
      "path": "photowalks-2024-08-31/DSCF6207-1920w.webp",
      "alt": "Evening street scene at West Lake, Hangzhou",
      "width": 1920,
      "height": 1280,
      "order": 1,
      "captureTime": "18:45",
      "camera": "Fujifilm X-T4",
      "lens": "XF 23mm f/1.4",
      "sizes": {
        "small": "photowalks-2024-08-31/DSCF6207-720w.webp",
        "large": "photowalks-2024-08-31/DSCF6207-1920w.webp"
      },
      "aspectRatio": "3:2"
    },
    {
      "id": "photowalk-2",
      "originalFilename": "DSCF6208.jpg",
      "baseFilename": "DSCF6208",
      "sourceFolder": "photowalks-2024-08-31",
      "path": "photowalks-2024-08-31/DSCF6208-1920w.webp",
      "alt": "Pedestrians crossing bridge at sunset",
      "width": 1920,
      "height": 1280,
      "order": 2,
      "captureTime": "19:12",
      "camera": "Fujifilm X-T4",
      "lens": "XF 23mm f/1.4",
      "sizes": {
        "small": "photowalks-2024-08-31/DSCF6208-720w.webp",
        "large": "photowalks-2024-08-31/DSCF6208-1920w.webp"
      },
      "aspectRatio": "3:2"
    },
    {
      "id": "photowalk-3",
      "originalFilename": "DSCF6209.jpg",
      "baseFilename": "DSCF6209",
      "sourceFolder": "photowalks-2024-08-31",
      "path": "photowalks-2024-08-31/DSCF6209-1920w.webp",
      "alt": "Night market vendors with colorful lights",
      "width": 1920,
      "height": 1280,
      "order": 3,
      "captureTime": "20:30",
      "camera": "Fujifilm X-T4",
      "lens": "XF 23mm f/1.4",
      "sizes": {
        "small": "photowalks-2024-08-31/DSCF6209-720w.webp",
        "large": "photowalks-2024-08-31/DSCF6209-1920w.webp"
      },
      "aspectRatio": "3:2"
    }
  ]
}
```

**CDN URL Examples:**
```tsx
// Desktop: https://cdn.yoursite.com/photowalks-2024-08-31/DSCF6207-1920w.webp
// Mobile: https://cdn.yoursite.com/photowalks-2024-08-31/DSCF6207-720w.webp
// Cached globally at 300+ edge locations for fast delivery
```

#### `public/image-references/global.json`
```json
{
  "type": "global",
  "lastUpdated": "2025-10-02",
  "cdnBase": "https://cdn.yoursite.com",
  "images": {
    "homepage": {
      "hero": {
        "originalFilename": "homepage-hero.jpg",
        "baseFilename": "homepage-hero",
        "sourceFolder": "homepage",
        "path": "homepage/homepage-hero-1920w.webp",
        "alt": "Andrew Liu Photography Portfolio - Featured Work",
        "width": 1920,
        "height": 1280,
        "sizes": {
          "small": "homepage/homepage-hero-720w.webp",
          "large": "homepage/homepage-hero-1920w.webp"
        },
        "aspectRatio": "3:2"
      }
    }
  }
}
```

#### `src/data/image-manifest.json`
```json
{
  "version": "1.0.0",
  "generatedAt": "2025-10-02T00:00:00Z",
  "cdnBase": "https://cdn.yoursite.com",
  "pages": {
    "home": {
      "reference": "/image-references/global.json",
      "imageCount": 1
    },
    "about": {
      "reference": "/image-references/about.json",
      "imageCount": 1
    },
    "contact": {
      "reference": "/image-references/contact.json",
      "imageCount": 0
    }
  },
  "projects": {
    "project-one": {
      "name": "New Comer",
      "reference": "/image-references/projects/project-one.json",
      "sourceFolder": "new-comer-2023",
      "imageCount": 45
    },
    "project-two": {
      "name": "Urban Landscapes",
      "reference": "/image-references/projects/project-two.json",
      "sourceFolder": "urban-landscapes-2024",
      "imageCount": 32
    },
    "project-three": {
      "name": "Project Three",
      "reference": "/image-references/projects/project-three.json",
      "sourceFolder": "project-three-2023",
      "imageCount": 28
    },
    "project-four": {
      "name": "Project Four",
      "reference": "/image-references/projects/project-four.json",
      "sourceFolder": "project-four-2024",
      "imageCount": 18
    },
    "project-five": {
      "name": "Project Five",
      "reference": "/image-references/projects/project-five.json",
      "sourceFolder": "project-five-2024",
      "imageCount": 22
    },
    "project-six": {
      "name": "Instagram Grid",
      "reference": "/image-references/projects/project-six.json",
      "sourceFolder": "instagram-2024",
      "imageCount": 36
    }
  },
  "events": {
    "photowalks-2024-08-31": {
      "reference": "/image-references/events/photowalks-2024-08-31.json",
      "imageCount": 3
    }
  }
}
```

---

### Step 3: Utility Functions

#### `src/lib/getImageUrl.ts`
```typescript
import { buildImageUrl, buildImageSrcSet } from '@/config/images.config'
import { getImageCdnUrl } from '@/config/cdn.config'
import type { ImageReference } from '@/types/images'

/**
 * Get a single image URL from the CDN
 * Example: getImageUrl('printsubs/DSCF6171-1920w.webp')
 * Returns: 'https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp'
 */
export function getImageUrl(path: string): string {
  return buildImageUrl(path)
}

/**
 * Get image URL by folder, filename, and size
 * Example: getImageByParams('printsubs', 'DSCF6171', '1920w')
 * Returns: 'https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp'
 */
export function getImageByParams(folder: string, filename: string, size: '720w' | '1920w'): string {
  return getImageCdnUrl(folder, filename, size)
}

/**
 * Load image references from JSON file
 */
export async function loadImageReferences(page: string): Promise<ImageReference[]> {
  const response = await fetch(`/image-references/${page}.json`)
  const data = await response.json()
  return data.images
}

/**
 * Get responsive srcset for an image (both 720w and 1920w)
 * Example: getImageSrcSet('printsubs', 'DSCF6171')
 * Returns: 'https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp 720w, https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp 1920w'
 */
export function getImageSrcSet(folder: string, filename: string): string {
  return buildImageSrcSet(folder, filename)
}

/**
 * Preload critical images (for above-the-fold content)
 */
export function preloadImage(folder: string, filename: string, size: '720w' | '1920w' = '1920w'): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = getImageCdnUrl(folder, filename, size)
  document.head.appendChild(link)
}
```

---

### Step 4: React Components

#### `src/components/OptimizedImage.tsx`
```typescript
'use client'

import Image from 'next/image'
import { getImageByParams } from '@/lib/getImageUrl'
import { useState } from 'react'

interface OptimizedImageProps {
  folder: string       // Folder name in R2 (e.g., "printsubs")
  filename: string     // Base filename without size suffix (e.g., "DSCF6171")
  size?: '720w' | '1920w'  // Image size (default: '1920w')
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  fallback?: string
}

export default function OptimizedImage({
  folder,
  filename,
  size = '1920w',
  alt,
  width,
  height,
  priority = false,
  className = '',
  fallback = '/placeholder.jpg'
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(getImageByParams(folder, filename, size))
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      console.warn(`Failed to load image: ${folder}/${filename}-${size}.webp, using fallback`)
      setImgSrc(fallback)
      setHasError(true)
    }
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={handleError}
      loading={priority ? undefined : 'lazy'}
    />
  )
}
```

#### `src/components/ResponsiveImage.tsx`
```typescript
'use client'

import { getImageByParams, getImageSrcSet } from '@/lib/getImageUrl'
import { useState } from 'react'

interface ResponsiveImageProps {
  folder: string       // Folder name in R2 (e.g., "printsubs")
  filename: string     // Base filename without size suffix (e.g., "DSCF6171")
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean   // Preload for above-the-fold images
}

export default function ResponsiveImage({
  folder,
  filename,
  alt,
  width,
  height,
  className = '',
  priority = false
}: ResponsiveImageProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <img
      src={getImageByParams(folder, filename, '1920w')}
      srcSet={getImageSrcSet(folder, filename)}
      sizes="(max-width: 768px) 720px, 1920px"
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? undefined : 'lazy'}
      onError={() => setHasError(true)}
    />
  )
}

// Example usage:
// <ResponsiveImage 
//   folder="printsubs" 
//   filename="DSCF6171" 
//   alt="Street photography"
//   width={1920}
//   height={1280}
// />
// Browser will choose:
// - Mobile (< 768px): loads printsubs/DSCF6171-720w.webp (~31KB)
// - Desktop (> 768px): loads printsubs/DSCF6171-1920w.webp (~145KB)
```

---

### Step 5: Usage in Pages

#### Example: `src/app/about/page.tsx` (Updated)

**BEFORE (Current):**
```tsx
<img 
  src="/about-image.jpg" 
  alt="About image" 
  style={{ width: '760px', height: 'auto' }}
/>
```

**AFTER (With CDN):**
```tsx
import OptimizedImage from '@/components/OptimizedImage'
import aboutImages from '@/../public/image-references/about.json'

export default function AboutPage() {
  const heroImage = aboutImages.images.hero
  
  return (
    <div className="layout">
      <Navigation />
      <div id="container" className="about-container ie">
        <div className="post">
          <div className="info">
            <div className="title section">About</div>
            <div className="clear"></div>
          </div>
          
          <div className="content">
            <figure style={{ marginBottom: '40px' }}>
              <OptimizedImage
                folder={heroImage.sourceFolder}
                filename={heroImage.baseFilename}
                size="1920w"
                alt={heroImage.alt}
                width={heroImage.width}
                height={heroImage.height}
                priority={true}
              />
            </figure>
            
            <p>
              <strong>Andrew Liu</strong>, born in 1993...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// This generates the CDN URL:
// https://cdn.yoursite.com/about/profile-photo-1920w.webp
```

#### Example: `src/app/works/project-one/page.tsx` (Updated)

**BEFORE:**
```tsx
<img src="/test-image.jpg" alt="Project image" />
```

**AFTER (With Responsive CDN Images):**
```tsx
import ResponsiveImage from '@/components/ResponsiveImage'
import projectImages from '@/../public/image-references/projects/project-one.json'

export default function ProjectOnePage() {
  return (
    <div className="layout">
      <Navigation />
      <div id="container">
        <div className="post">
          {projectImages.images.map((img) => (
            <div key={img.id} className="imageElement ie">
              <div className="wp-caption">
                <ResponsiveImage
                  folder={img.sourceFolder}
                  filename={img.baseFilename}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// This generates responsive images:
// Mobile: https://cdn.yoursite.com/new-comer-2023/IMG_0001-720w.webp (31KB)
// Desktop: https://cdn.yoursite.com/new-comer-2023/IMG_0001-1920w.webp (145KB)
// Cached globally for fast delivery
```

---

## Part 4: Implementation Steps for This Repository

### Step 1: Update Next.js Configuration
**File:** `next.config.js`

Add your CDN domain to enable Next.js Image optimization:
```javascript
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.yoursite.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
}
```

**Note:** Replace `cdn.yoursite.com` with your actual custom domain configured in Cloudflare R2 settings.

### Step 2: Create Configuration Files
1. Create `src/config/cdn.config.ts`
2. Create `src/config/images.config.ts`
3. Update with your actual CDN URLs

### Step 3: Create Image Reference System
1. Create `public/image-references/` directory
2. Create JSON files for each page/project
3. Map your existing images to R2 bucket structure

### Step 4: Create Utility Functions
1. Create `src/lib/getImageUrl.ts`
2. Create `src/lib/imageOptimizer.ts` (if needed)
3. Create TypeScript types in `src/types/images.ts`

### Step 5: Create React Components
1. Create `src/components/OptimizedImage.tsx`
2. Create `src/components/ResponsiveImage.tsx` (optional)
3. Test components with CDN URLs

### Step 6: Update Page Components
1. Update `src/app/page.tsx` (home)
2. Update `src/app/about/page.tsx`
3. Update `src/app/contact/page.tsx`
4. Update all `src/app/works/project-*/page.tsx`

### Step 7: Testing Strategy
1. Test with CDN URLs in development
2. Test fallback images work
3. Test responsive images on different devices
4. Verify performance improvements
5. Check browser console for errors

### Step 8: Cleanup
1. Remove old images from `public/` folder (keep only fallbacks)
2. Update `.gitignore` to exclude large local images
3. Document the new image workflow
4. Update README with CDN information

---

## Part 5: Workflow After Setup

### Adding New Images

**Process:**
1. Add high-res image to private repo (`portfolio-images/images/`)
2. Push to GitHub → GitHub Actions automatically:
   - Optimizes image with Sharp
   - Uploads to R2 bucket
3. Update corresponding JSON file in `public/image-references/`
4. Component automatically loads new image from CDN

**Example Workflow:**
```bash
# In private repo
cd portfolio-images
cp ~/new-photo.tiff images/projects/project-seven/
git add .
git commit -m "Add new photo to project seven"
git push
# GitHub Actions processes and uploads automatically

# In public repo
cd aandrx.github.io
# Edit public/image-references/projects/project-seven.json
# Add new image entry with path "projects/project-seven/new-photo.webp"
git add .
git commit -m "Reference new photo from CDN"
git push
# Deployment shows new image
```

---

## Part 6: Benefits of This Structure

### Centralized Management
- All image references in JSON files
- Easy to update paths without touching components
- Version control for image metadata

### Type Safety
- TypeScript interfaces for image data
- Compile-time checking for image properties
- IDE autocomplete for image paths

### Performance
- CDN edge caching
- WebP format (smaller files)
- Responsive images with srcset
- Lazy loading support

### Maintainability
- Separated concerns (config, data, components, pages)
- Reusable components
- Easy to swap CDN providers
- Fallback system for reliability

### Developer Experience
- Import JSON files directly
- No hardcoded URLs in components
- Easy local development
- Clear documentation

---

## Part 7: Alternative Approaches

### Approach A: Direct Imports (Simpler)
```tsx
// Simple but less flexible
const imageUrl = 'https://cdn.yoursite.com/about-image.webp'
<img src={imageUrl} alt="About" />
```

### Approach B: Environment Variables
```tsx
// In .env.local
NEXT_PUBLIC_CDN_URL=https://cdn.yoursite.com

// In component
const imageUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/about-image.webp`
```

### Approach C: CMS Integration (Future)
```tsx
// Fetch from headless CMS
const images = await fetchFromCMS('project-one')
```

### Approach D: Dynamic Manifest Generation
```tsx
// Auto-generate manifest from R2 bucket API
// Keeps JSON files in sync automatically
```

---

## Part 8: Migration Checklist

### Pre-Migration
- [ ] Verify R2 bucket is accessible
- [ ] Confirm custom domain is working
- [ ] Test CDN caching
- [ ] Document current image inventory

### During Migration
- [ ] Create configuration files
- [ ] Create JSON reference files
- [ ] Build utility functions
- [ ] Create image components
- [ ] Update one page as test
- [ ] Verify test page works
- [ ] Update remaining pages
- [ ] Update all project pages

### Post-Migration
- [ ] Test all pages
- [ ] Check mobile responsiveness
- [ ] Verify performance metrics
- [ ] Remove old images from public folder
- [ ] Update documentation
- [ ] Deploy to production

---

## Part 9: Troubleshooting Guide

### Issue: Images not loading
- Check CDN URL is correct
- Verify R2 bucket has public access
- Check browser console for CORS errors
- Verify Next.js image domains configuration

### Issue: Slow loading
- Confirm CDN is enabled
- Check cache headers
- Verify WebP format is being served
- Use browser dev tools Network tab

### Issue: 404 errors
- Verify image path matches R2 structure
- Check JSON file paths are correct
- Confirm GitHub Actions uploaded successfully
- Verify R2 bucket name in configuration

---

## Summary

This structure provides:
1. **Clear separation** between image data (JSON) and presentation (components)
2. **Type-safe** image handling with TypeScript
3. **Flexible** CDN switching without code changes
4. **Maintainable** centralized configuration
5. **Performant** with Next.js Image optimization
6. **Scalable** for adding new images/projects

The JSON reference system acts as a **"bridge"** between your R2 bucket structure and your Next.js components, making it easy to manage, update, and maintain your image assets.
