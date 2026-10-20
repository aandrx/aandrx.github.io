import './nightfind-2026.css'
import ProjectGallery from '@/components/ProjectGallery'

// Replace the selected folder and filenames when the new collection is published.
const folder = 'nightfind-2024-10-24-30'
const imageFilenames = ['DSCF9391-Edit', 'DSCF9422-Edit', 'DSCF9425-Edit']
const images = imageFilenames.map((filename) => ({ src: `${folder}/${filename}`, alt: `Nightfind 2026 ${filename}` }))

export default function Nightfind2026Page() {
  return (
    <ProjectGallery title="Nightfind 2026" layoutClass="nightfind-2026-layout" images={images}>
      <p>A new chapter of Nightfind focused on slower walks and cleaner lines of light.</p>
      <p>Still searching for the small moments where motion, shadow, and color briefly align.</p>
      <p>Built to expand as new frames are added through the year.</p>
      <p>October 24-30, 2026</p>
    </ProjectGallery>
  )
}
