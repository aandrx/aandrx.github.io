### bulletport

An ultra-minimal portfolio website inspired by [ziyile.com](https://ziyile.com/), built with Next.js 15 and TypeScript. This project focuses on extreme simplicity, clean typography, and maximum white space.

## Tech Stack (Minimal)

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (minimal usage)
- **Font**: Inter (Google Fonts)
- **No additional libraries**: Pure React and Next.js only


## Getting Started

1. **Install dependencies**:
\`\`\`
npm install
\`\`\`

2. **Start development server**:
\`\`\`
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
