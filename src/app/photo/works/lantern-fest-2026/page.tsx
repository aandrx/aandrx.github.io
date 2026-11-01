import './lantern-fest-2026.css'
import ProjectGallery from '@/components/ProjectGallery'

const folder = 'lantern-fest-2026-03-15'
const imageFilenames = ['DSCF8346-Edit', 'DSCF8336-Edit', 'DSCF8326-Edit', 'DSCF8330-Edit', 'DSCF8328-Edit']
const images = imageFilenames.map((filename) => ({ src: `${folder}/${filename}`, alt: `Lantern Fest 2026 ${filename}` }))

export default function LanternFest2026Page() {
  return (
    <ProjectGallery title="Lantern Fest 2026" layoutClass="lantern-fest-2026-layout" images={images}>
      <p>The lantern festival arrives once a year, marking the first full moon of the lunar new year. The banquet hall fills with lights and the feeling of spring entering, a threshold between the lingering stress of school and the coming spring break. </p>
      <p>I had been living in the same rhythm for months - work, sleep, the same routes between the same places. Something about the festival felt like permission to look up, to enjoy a formal banquet with no bounds, getting to move through freely with my lens and no particular destination.</p>
      <p>What drew me to photograph it was not the spectacle itself but the faces gathered around it: strangers standing close together in the dark, sharing warmth in front of something briefly bright. The performances and bright lights surrounding the venue gave everyone a reason to participate.</p>
      <p>I spent the evening moving through crowds without a plan, following light wherever it pooled. There is a particular quality to photographs made in celebration, something between documentation and longing, as though the camera already knows the night is ending.</p>
      <p>March 15, 2026</p>
    </ProjectGallery>
  )
}
