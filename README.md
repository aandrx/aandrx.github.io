# Bulletportfolio - Ultra-Minimal Portfolio

An ultra-minimal portfolio website inspired by [ziyile.com](https://ziyile.com/), built with Next.js 15 and TypeScript. This project focuses on extreme simplicity, clean typography, and maximum white space.

## Design Philosophy

- **Ultra-minimal**: Only essential elements, no unnecessary UI components
- **Clean typography**: Simple, readable fonts with careful spacing
- **Maximum white space**: Generous padding and spacing for clarity
- **Content-first**: Focus on the work, not the interface
- **Fast loading**: Minimal dependencies and optimized performance

## Features

- 🎯 **Ultra-minimal design**: Inspired by ziyile.com's clean aesthetic
- 📱 **Responsive layout**: Works perfectly on all devices
- 🖼️ **Simple gallery**: Clean grid layout for portfolio pieces
- ⚡ **Lightning fast**: Minimal dependencies and optimal performance
- 🎨 **Clean typography**: Beautiful Inter font with careful spacing
- 📄 **Static pages**: About and Contact pages with essential information only

## Tech Stack (Minimal)

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (minimal usage)
- **Font**: Inter (Google Fonts)
- **No additional libraries**: Pure React and Next.js only

## Project Structure

\`\`\`
src/
├── app/
│   ├── about/page.tsx          # Minimal about page
│   ├── contact/page.tsx        # Simple contact information
│   ├── works/page.tsx          # Clean portfolio gallery
│   ├── globals.css             # Ultra-minimal styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Homepage with name and nav
├── components/
│   └── Navigation.tsx          # Simple navigation component
└── public/
    └── placeholder-*.jpg       # Sample portfolio images
\`\`\`

## Getting Started

1. **Install dependencies**:
\`\`\`bash
npm install
\`\`\`

2. **Start development server**:
\`\`\`bash
npm run dev
\`\`\`

3. **Open browser**: Visit [http://localhost:3000](http://localhost:3000)

## Customization

### Content
1. **Name**: Update "Your Name" in \`src/components/Navigation.tsx\`
2. **Portfolio**: Replace placeholder images in \`public/\` directory
3. **About**: Edit content in \`src/app/about/page.tsx\`
4. **Contact**: Update contact details in \`src/app/contact/page.tsx\`
5. **Projects**: Modify project data in \`src/app/works/page.tsx\`

### Styling
- **Colors**: All styling is in \`src/app/globals.css\`
- **Typography**: Using Inter font with minimal weights
- **Layout**: Pure CSS Grid and Flexbox
- **Spacing**: Consistent margin and padding classes

## Design Principles

Based on ziyile.com's ultra-minimal approach:

1. **Name first**: The homepage features only your name and navigation
2. **Simple navigation**: Just three links - Works, About, Contact
3. **Clean gallery**: Grid layout with no decorative elements
4. **Minimal text**: Only essential information
5. **Generous spacing**: Lots of white space for clarity
6. **No animations**: Static, calm interface
7. **Fast loading**: Minimal assets and dependencies

## Performance

- **Build size**: ~102KB First Load JS
- **Static generation**: All pages pre-rendered
- **No JavaScript framework overhead**: Pure React
- **Optimized images**: Next.js Image component
- **Minimal CSS**: Only essential styles

## Deployment

Deploy to any static hosting platform:

- **Vercel**: \`vercel --prod\`
- **Netlify**: Connect repository for auto-deploy
- **GitHub Pages**: Export static files
- **Any CDN**: Build and upload \`.next/\` directory

## License

MIT License - feel free to use as a starting point for your own minimal portfolio.

---

*Inspired by the beautiful simplicity of ziyile.com*
