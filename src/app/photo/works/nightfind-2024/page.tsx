import './nightfind-2024.css'
import ProjectGallery from '@/components/ProjectGallery'

const groups = [
  { folder: 'nightfind-2024-09-24-25', filenames: ['DSCF7571-Edit', 'DSCF7572-Edit', 'DSCF7760-Edit', 'DSCF7839-Edit', 'DSCF7908-Edit', 'DSCF7963-Edit', 'DSCF7974-Edit', 'DSCF7975-Edit', 'DSCF8012-Edit-2'] },
  { folder: 'nightfind-2024-10-11-31-6', filenames: ['DSCF3371-Edit', 'DSCF3386-Edit', 'DSCF3387-Edit-2'] },
  { folder: 'nightfind-2024-10-24-30', filenames: ['DSCF9391-Edit', 'DSCF9422-Edit', 'DSCF9425-Edit', 'DSCF9426-Edit', 'DSCF9426-Edit-2', 'DSCF9430-Edit', 'DSCF9432-Edit'] },
]
const images = groups.flatMap(({ folder, filenames }, groupIndex) => filenames.map((filename, index) => ({
  src: `${folder}/${filename}`,
  alt: `Nightfind 2024 ${filename}`,
  separator: groupIndex > 0 && index === 0,
})))

export default function Nightfind2024Page() {
  return (
    <ProjectGallery title="Nightfind 2024" layoutClass="nightfind-2024-layout" images={images}>
      <p>Where I first started with working with nighttime photography.</p>
      <p>Watching for exposure, thinking about composition, modifying settings, and steadying my hands.</p>
      <p>It began as a soft practice for capturing the beauty of the night, but quickly became more routine as I hurried back to my dorm after late classes, or night-grind sessions. Today, this directly embodies what I hope to capture through my lens.</p>
      <p>September 24-25, 2024</p>
    </ProjectGallery>
  )
}
