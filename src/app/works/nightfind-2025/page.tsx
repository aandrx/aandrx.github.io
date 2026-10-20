import './nightfind-2025.css'
import ProjectGallery from '@/components/ProjectGallery'

const groups = [
  { folder: 'fuji-gt-2025-1-15-31', filenames: ['DSCF9903-Edit', 'DSCF9905-Edit-2-2', 'DSCF9906-Edit', 'DSCF9907-Edit-2'] },
  { folder: 'fuji-gt-2025-8-11-16-17', filenames: ['DSCF5835-Edit'] },
  { folder: 'fuji-gt-2025-9-18', filenames: ['DSCF5807-Edit'] },
]
const images = groups.flatMap(({ folder, filenames }) => filenames.map((filename) => ({ src: `${folder}/${filename}`, alt: `Nightfind 2025 ${filename}` })))

export default function Nightfind2025Page() {
  return (
    <ProjectGallery title="Nightfind 2025" layoutClass="nightfind-2025-layout" images={images}>
      <p>A continuation of Nightfind, now with sharper contrast and quieter streets.</p>
      <p>Moving between corners of light, waiting for brief moments to settle into frame.</p>
      <p>The routine stayed the same: walk, pause, adjust settings, and follow the night until it opens up.</p>
      <p>2025, January 2025</p>
    </ProjectGallery>
  )
}
