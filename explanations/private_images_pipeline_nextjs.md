# Private Image Hosting Pipeline with Cloudflare R2 + CDN for Public Website

This document outlines a complete workflow for storing high-resolution images in a private GitHub repository, automatically converting them to web-friendly formats using Node.js + Sharp, hosting them on Cloudflare R2, integrating Cloudflare CDN, and referencing them from a public website repository.

---

## Step 1: Create a Private Repository for High-Quality Images

**Purpose:** Secure storage of original high-res images.

1. Create a new private GitHub repository (e.g., `portfolio-images`).
2. Structure the repository:
```
/images
    photo1.tiff
    photo2.png
    banner.psd
```
3. Push local images:
```bash
git init
git add .
git commit -m "Add high-res images"
git branch -M main
git remote add origin git@github.com:yourusername/portfolio-images.git
git push -u origin main
```

---

## Step 2: Set Up Image Processing Pipeline (Node.js + Sharp)

**Purpose:** Convert images to optimized web-friendly formats.

1. Install Node.js and initialize project:
```bash
npm init -y
npm install sharp
```
2. Create `convert-images.js` to:
   - Resize images (e.g., max width 1920px)
   - Convert to WebP
   - Compress for web
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './images';
const outputDir = './optimized';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

fs.readdirSync(inputDir).forEach(file => {
  const inputPath = path.join(inputDir, file);
  const outputName = path.parse(file).name + '.webp';
  const outputPath = path.join(outputDir, outputName);

  sharp(inputPath)
    .resize({ width: 1920 })
    .webp({ quality: 80 })
    .toFile(outputPath)
    .then(() => console.log(`Processed ${file} -> ${outputName}`));
});
```
3. Test locally:
```bash
node convert-images.js
```
- `optimized/` will contain WebP images.

---

## Step 3: Set Up Cloudflare R2 Bucket

**Purpose:** Host optimized images publicly via R2.

1. Sign in to Cloudflare → R2 → Create Bucket.
2. Name bucket (e.g., `portfolio-images`).
3. Enable **Public Read Access**.
4. Optionally configure a **custom domain** for cleaner URLs (e.g., `cdn.yoursite.com`).

---

## Step 4: Integrate Cloudflare CDN

**Purpose:** Serve images globally with caching and speed improvements.

1. By default, R2 URLs go through Cloudflare's global CDN automatically.
2. Optional advanced setup:
   - Create a CNAME (e.g., `cdn.yoursite.com`) pointing to your R2 bucket endpoint.
   - Use a **Cloudflare Worker** for additional features:
     - Custom caching headers
     - Dynamic image resizing
     - WebP fallback support
3. Ensure caching headers are set for optimal performance (e.g., `Cache-Control: max-age=31536000`).

**Benefits of CDN:**
- Edge caching → fast load times for global visitors
- Bandwidth optimization → reduces direct R2 requests
- Free tier → unlimited R2 egress + CDN caching within limits
- HTTPS automatically enabled

---

## Step 5: Automate Upload to Cloudflare R2 + CDN

**Purpose:** Automatically push optimized images from private repo to R2.

1. Install R2 CLI or rclone:
```bash
npm install -g @cloudflare/wrangler
# or
brew install rclone
```
2. Configure authentication using Cloudflare API keys.
3. Create GitHub Actions workflow: `.github/workflows/deploy-images.yml`
```yaml
name: Optimize and Deploy Images
on:
  push:
    paths:
      - 'images/**'

jobs:
  optimize-and-upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install sharp

      - name: Process Images with Sharp
        run: node convert-images.js

      - name: Upload to Cloudflare R2
        run: rclone copy ./optimized cloudflare-r2:portfolio-images
        env:
          RCLONE_CONFIG_CLOUDFLARE_TYPE: s3
          RCLONE_CONFIG_CLOUDFLARE_ACCESS_KEY_ID: ${{ secrets.CF_R2_KEY }}
          RCLONE_CONFIG_CLOUDFLARE_SECRET_ACCESS_KEY: ${{ secrets.CF_R2_SECRET }}
          RCLONE_CONFIG_CLOUDFLARE_ENDPOINT: https://<account_id>.r2.cloudflarestorage.com
```
- Workflow triggers on pushes to private repo.
- GitHub Secrets store API keys securely.
- Optimized images are automatically served via Cloudflare CDN.

---

## Step 6: Reference Hosted Images in Public Website

**Purpose:** Serve optimized, CDN-hosted images without including them in the public repo.

1. Use R2 + CDN URLs in your HTML:
```html
<img src="https://cdn.yoursite.com/photo1.webp" alt="Portfolio Photo">
```
2. Optional: `<picture>` element for WebP fallback:
```html
<picture>
  <source srcset="https://cdn.yoursite.com/photo1.webp" type="image/webp">
  <img src="https://cdn.yoursite.com/photo1.jpg" alt="Portfolio Photo">
</picture>
```
3. Optional: Maintain `images.js` or `images.json` manifest for dynamic galleries.

---

## Step 7: Optional Enhancements

- **Responsive images:** Generate multiple widths (480px, 720px, 1080px) and use `srcset`.
- **Advanced caching:** Use Cloudflare Workers for custom headers and cache strategies.
- **Dynamic WebP fallback:** Workers can serve WebP first, fallback JPG/PNG automatically.
- **Metadata support:** Include captions, alt text, or categories in manifest for dynamic galleries in Next.js or React.

---

## Benefits

| Step | Benefit |
|------|---------|
| Private repo | Secure high-res originals |
| Node.js + Sharp pipeline | Optimized images (WebP, resized, compressed) |
| Cloudflare R2 | Fast, free storage + CDN integration |
| Cloudflare CDN | Global edge caching, faster load, reduced egress |
| GitHub Actions | Fully automated workflow for updates |
| Public site references CDN URLs | Lightweight site, fast load times, scalable |

---

**Outcome:**
- High-res images remain private and secure.
- Public website uses optimized images served via Cloudflare R2 and CDN.
- Workflow is fully automated: pushing new images to the private repo triggers optimization and CDN deployment.
