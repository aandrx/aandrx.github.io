# Using R2 Images in Your Public Website via CDN

## Overview

Your images are stored in **Cloudflare R2** (private storage) and served through a **Cloudflare CDN** (public delivery network). This guide explains how to reference these images in your public portfolio website.

## How the CDN Works

### Architecture Flow:

```
1. Original Image (Private Repo)
   images/printsubs/DSCF6171.jpg (8.5MB)
   
2. Optimized Images (R2 Bucket - Private)
   cloudflare-r2://portfolio-resources/printsubs/DSCF6171-720w.webp (31KB)
   cloudflare-r2://portfolio-resources/printsubs/DSCF6171-1920w.webp (145KB)
   
3. CDN (Public URL - Globally Cached)
   https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp
   https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp

4. Your Public Website (aandrx.github.io)
   <img src="https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp">
   ↓
   Visitor sees optimized image loaded from nearest CDN edge server
```

### Complete End-to-End Example:

```
Workflow:
1. You add DSCF6171.jpg (8.5MB) to images/printsubs/
2. Push to GitHub → Workflow processes image → Uploads to R2
3. Your website (aandrx.github.io) references:
   <img src="https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp">
4. Visitor in Tokyo visits aandrx.github.io
5. Browser requests image from CDN
6. Cloudflare serves from Tokyo edge server (< 50ms)
7. Visitor sees fast-loading, optimized image
```

### What Happens When Someone Visits Your Website:

1. **Browser requests image:** `https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp`
2. **Cloudflare CDN checks:** Is this file cached on a nearby edge server?
   - **YES:** Serves from cache instantly (< 50ms)
   - **NO:** Fetches from R2 bucket, caches it, then serves it
3. **Subsequent requests:** Served from cache globally

### Benefits:

- **Fast:** Images served from 300+ locations worldwide
- **Cheap:** R2 has zero egress fees (unlike AWS S3)
- **Reliable:** Cloudflare's infrastructure handles traffic spikes
- **Private originals:** Your high-res photos stay in private repo

## Setting Up Your CDN Domain

### Option 1: Custom Domain (Recommended)

1. **Go to Cloudflare Dashboard** → Your R2 Bucket → Settings
2. **Connect Custom Domain:**
   - Domain: `cdn.yoursite.com` (or `images.yoursite.com`)
   - This creates a CNAME record automatically
3. **Your images are now accessible at:**
   ```
   https://cdn.yoursite.com/folder-name/image-name.webp
   ```

### Option 2: R2.dev Subdomain (Quick Setup)

1. **Go to R2 Bucket Settings**
2. **Enable Public Access** via R2.dev domain
3. **You'll get a URL like:**
   ```
   https://pub-abc123xyz.r2.dev/folder-name/image-name.webp
   ```
4. **Note:** Less professional, harder to remember

## Referencing Images in Your Public Website

### File Structure in R2:

```
portfolio-resources/ (R2 bucket)
├── photowalks-2024-08-31/
│   ├── DSCF6207-720w.webp
│   ├── DSCF6207-1920w.webp
│   ├── DSCF6239-720w.webp
│   └── DSCF6239-1920w.webp
└── printsubs/
    ├── DSC00210-720w.webp
    ├── DSC00210-1920w.webp
    └── ...
```

### Basic HTML Usage:

```html
<!-- Simple image -->
<img 
  src="https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp" 
  alt="Portfolio photo"
  width="1920" 
  height="1280"
>
```

### Responsive Images (Recommended):

Use `srcset` to serve the right size for each device:

```html
<img 
  src="https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp" 
  srcset="
    https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp 720w,
    https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp 1920w
  "
  sizes="(max-width: 768px) 720px, 1920px"
  alt="Portfolio photo"
  loading="lazy"
>
```

**How it works:**
- Mobile/tablet (< 768px): Loads 720w version (31KB)
- Desktop (> 768px): Loads 1920w version (145KB)
- `loading="lazy"`: Images load only when scrolled into view

### React/Next.js Usage:

#### Next.js Image Component:

```jsx
import Image from 'next/image'

export default function PortfolioImage() {
  return (
    <Image
      src="https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp"
      alt="Portfolio photo"
      width={1920}
      height={1280}
      quality={85}
      loading="lazy"
    />
  )
}
```

#### Next.js Responsive with `srcset`:

```jsx
<picture>
  <source
    srcSet="https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp"
    media="(min-width: 768px)"
  />
  <img
    src="https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp"
    alt="Portfolio photo"
    loading="lazy"
  />
</picture>
```

#### Configure Next.js for External Images:

Add to `next.config.js`:

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
  },
}
```

### CSS Background Images:

```css
.hero-section {
  background-image: url('https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp');
  background-size: cover;
  background-position: center;
}

/* Responsive backgrounds */
@media (max-width: 768px) {
  .hero-section {
    background-image: url('https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp');
  }
}
```

## URL Structure Reference

Your CDN URLs follow this pattern:

```
https://cdn.yoursite.com/{folder-name}/{image-name}-{size}w.webp
```

### Examples:

| Original File | CDN URL (720w) | CDN URL (1920w) |
|--------------|----------------|-----------------|
| `images/printsubs/DSCF6171.jpg` | `https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp` | `https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp` |
| `images/photowalks-2024-08-31/DSCF6207.jpg` | `https://cdn.yoursite.com/photowalks-2024-08-31/DSCF6207-720w.webp` | `https://cdn.yoursite.com/photowalks-2024-08-31/DSCF6207-1920w.webp` |

## Gallery Example (Full Implementation)

Here's a complete responsive gallery component:

```jsx
// components/ImageGallery.jsx
const images = [
  {
    folder: 'printsubs',
    name: 'DSCF6171',
    alt: 'Street photography portrait',
    width: 1920,
    height: 1280
  },
  {
    folder: 'printsubs',
    name: 'DSC00210',
    alt: 'Urban landscape',
    width: 1920,
    height: 1280
  },
  {
    folder: 'photowalks-2024-08-31',
    name: 'DSCF6207',
    alt: 'City night scene',
    width: 1920,
    height: 1280
  }
]

const CDN_BASE = 'https://cdn.yoursite.com'

export default function ImageGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((img) => (
        <img
          key={`${img.folder}/${img.name}`}
          src={`${CDN_BASE}/${img.folder}/${img.name}-1920w.webp`}
          srcSet={`
            ${CDN_BASE}/${img.folder}/${img.name}-720w.webp 720w,
            ${CDN_BASE}/${img.folder}/${img.name}-1920w.webp 1920w
          `}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={img.alt}
          loading="lazy"
          className="w-full h-auto rounded-lg"
        />
      ))}
    </div>
  )
}
```

## Performance Tips

### 1. Always Use `loading="lazy"`
Defers loading off-screen images:
```html
<img src="..." loading="lazy">
```

### 2. Specify Width & Height
Prevents layout shift:
```html
<img src="..." width="1920" height="1280">
```

### 3. Use Responsive Images
Let the browser choose the right size:
```html
<img 
  srcset="image-720w.webp 720w, image-1920w.webp 1920w"
  sizes="(max-width: 768px) 720px, 1920px"
>
```

### 4. Preload Critical Images
For above-the-fold hero images:
```html
<link rel="preload" as="image" href="https://cdn.yoursite.com/hero-1920w.webp">
```

## Cache Control & Updates

### How Caching Works:

- **First request:** CDN fetches from R2, caches for ~24 hours
- **Subsequent requests:** Served from CDN cache instantly
- **Cache location:** Nearest edge server to the visitor

### When You Update an Image:

1. **Re-run workflow:** Uploads new version to R2
2. **Cache invalidation:** Old version cached for ~24 hours
3. **Solution:** Rename the image file to force immediate update

Example:
```
Old: DSCF6171-1920w.webp
New: DSCF6171-Edit-1920w.webp  (forces new cache)
```

Or use Cloudflare's cache purge:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://cdn.yoursite.com/printsubs/DSCF6171-1920w.webp"]}'
```

## Testing Your Setup

### 1. Test Image Accessibility:

Open browser and navigate to:
```
https://cdn.yoursite.com/printsubs/DSCF6171-720w.webp
```

You should see the image. If not:
- Check R2 bucket has public CDN enabled
- Verify custom domain is connected
- Check image was uploaded (view R2 bucket in dashboard)

### 2. Test CDN Performance:

Use browser DevTools Network tab:
- **First load:** `X-Cache: MISS` (fetched from R2)
- **Second load:** `X-Cache: HIT` (served from CDN cache)
- **Response time:** Should be < 100ms for cached images

### 3. Test Responsive Images:

Resize browser window and check Network tab:
- Small screen: Loads 720w version
- Large screen: Loads 1920w version

## Cost Estimation

### R2 Pricing (as of 2024):
- **Storage:** $0.015/GB/month (~$0.015 for 1000 photos)
- **Class A operations (write):** $4.50/million (~$0.05 for all uploads)
- **Class B operations (read):** $0.36/million (mostly free with CDN)
- **Egress:** $0 (FREE - Cloudflare's main advantage)

### Example with 1000 images:
- Storage: ~10GB = **$0.15/month**
- Uploads: ~1000 operations = **$0.005**
- CDN reads: Mostly cached = **~$0**
- **Total: < $1/month**

Compare to AWS S3 with CloudFront:
- Storage: ~10GB = $0.23/month
- Egress: 100GB = **$9.00/month** (Cloudflare R2 = $0)
- **AWS Total: ~$10/month vs Cloudflare: $0.15/month**

## Security Notes

### Your Setup is Secure:

1. **Private originals:** High-res images stay in private GitHub repo
2. **R2 bucket is private:** Only accessible via CDN domain
3. **No direct R2 access:** Users can't browse your bucket
4. **HTTPS only:** All CDN traffic is encrypted

### Public Access Control:

If you want to restrict access:
- Use Cloudflare Access (authentication layer)
- Use signed URLs (temporary access tokens)
- Implement hotlink protection

## Summary

### Your Workflow:

1. **Add images** to `images/folder-name/` in private repo
2. **Push to GitHub** - automatic processing and upload
3. **Reference in website:** `https://cdn.yoursite.com/folder-name/image-name-720w.webp`
4. **Cloudflare CDN** serves images globally with zero egress fees

### Key URLs:

- **Private repo:** `github.com/aandrx/portfolio-resources` (source)
- **R2 bucket:** `portfolio-resources` (storage)
- **CDN domain:** `https://cdn.yoursite.com` (public delivery)
- **Public website:** References CDN URLs

### Next Steps:

1. Set up custom domain for R2 bucket (`cdn.yoursite.com`)
2. Test image accessibility in browser
3. Implement responsive images in your public website
4. Monitor CDN cache performance

Need help with any of these steps? Check the Cloudflare R2 documentation or ask for specific implementation examples.
