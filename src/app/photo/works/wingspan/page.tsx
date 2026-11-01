import './wingspan.css'
import ProjectGallery from '@/components/ProjectGallery'

const groups = [
  { folder: 'fuji-gt-2024-11-12-17-3', filenames: ['DSCF3711-Edit-Edit', 'DSCF3723-Edit-Edit'] },
  { folder: 'fuji-plane-2025-1-4', filenames: ['DSCF9847-Edit'] },
  { folder: 'fuji-nyc-2026-6-5-6', filenames: ['DSCF9061-Edit', 'DSCF9063-Edit'] },
  { folder: 'fuji-gt-2026-1-9', filenames: ['DSCF6988-Edit'] },
]
const images = groups.flatMap(({ folder, filenames }) => filenames.map((filename) => ({ src: `${folder}/${filename}`, alt: `Wingspan ${folder} ${filename}` })))

export default function WingspanPage() {
  return (
    <ProjectGallery title="Wingspan" layoutClass="wingspan-layout" images={images}>
      <p>Wingspan begins in transit, in those in-between hours when terminals blur into runways and every window becomes a moving frame. The work follows motion more than destination, tracing the quiet choreography of departures, crossings, and returns.</p>
      <p>These photographs were made across separate trips, but they share the same impulse: to hold onto brief alignments of weather, light, and distance before they dissolve. Aircraft, streets, and open sky each become different ways of measuring time.</p>
      <p>What interests me most is the tension between scale and intimacy. A plane can dominate the horizon one moment, then vanish into a line of cloud, while a face in a station or a reflection in a window can carry the same sense of vastness.</p>
      <p>As the sequence moves forward, the images shift from grounded scenes toward wider air and city views, building a rhythm of lift, drift, and return. Together they read like fragments of one long route, stitched from places that were never meant to stay still.</p>
      <p>November 2024, January 2025, June 2026, January 2026</p>
    </ProjectGallery>
  )
}
