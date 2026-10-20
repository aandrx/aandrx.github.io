import './starry-night-2026.css'
import ProjectGallery from '@/components/ProjectGallery'

const folder = 'starrynight-2026-10-15'
const imageFilenames = [
  'DSCF3413-Edit',
  'DSCF3434-Edit',
  'DSCF3436-Edit',
  'DSCF3452-Edit',
  'DSCF3455-Edit',
  'DSCF3471-Edit',
  'DSCF3472-Edit',
  'DSCF3473-Edit',
  'DSCF3474-Edit',
  'DSCF3629-Edit',
  'DSCF3774-Edit',
  'DSCF3775-Edit',
  'DSCF3780-Edit',
]
const images = imageFilenames.map((filename) => ({ src: `${folder}/${filename}`, alt: `Starry Night ${filename}` }))

export default function StarryNight2026Page() {
  return (
    <ProjectGallery title="Starry Night 2026" layoutClass="starry-night-2026-layout" images={images}>
      <p>Starry Night returned a year later, this time in the open air. What began as an afternoon gathering carried into the evening: performers crossing the pavement, dancers in pale purple moving together, and a crowd that kept arriving as the light went down.</p>
      <p>The first Starry Night was about finding my place in a room. This time I knew the rhythm of the event, so the camera moved differently. I spent less time searching for the big moment and more time waiting for the small ones: a performer looking up at his own trick, hands caught mid-gesture, the moment a crowd goes quiet.</p>
      <p>The stage changed as the night came in. Colored lights opened up through the lens, and the music pushed the photographs toward something less documentary, more impression. I stopped trying to freeze the scene and let it blur.</p>
      <p>Starry Night is still an event organized by our school's Chinese Student Association, still a reason for people scattered across the unfamiliar grounds to gather. A year apart did not make the feeling less familiar; it made the details easier to see.</p>
      <p>October 15, 2026</p>
    </ProjectGallery>
  )
}
