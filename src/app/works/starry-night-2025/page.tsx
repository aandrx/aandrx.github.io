import './starry-night-2025.css'
import ProjectGallery from '@/components/ProjectGallery'

const folder = 'starrynight-2025-10-16'
const imageFilenames = [
  'DSCF5995-Edit',
  'DSCF6168-Edit',
  'DSCF6315-Edit-2',
  'DSCF6348-Edit',
  'DSCF6036-Edit',
  'DSCF6205-Edit',
  'DSCF5997-Edit',
  'DSCF6167-Edit',
  'DSCF6204-Edit',
  'DSCF5994-Edit',
  'DSCF6286-Edit',
  'DSCF6308-Edit',
  'DSCF6335-Edit',
  'DSCF6377-Edit',
]
const images = imageFilenames.map((filename) => ({ src: `${folder}/${filename}`, alt: `Starry Night ${filename}` }))

export default function StarryNight2025Page() {
  return (
    <ProjectGallery title="Starry Night 2025" layoutClass="starry-night-2025-layout" images={images}>
      <p>Growing up between two worlds, I spent years navigating the quiet distance between where I came from and where I was trying to go; a persistent sense of standing somewhere in the middle of nowhere. Every time the weight of that in-between feeling surfaced, my instinct was simply to look away.</p>
      <p>In the fall of 2024, I moved across an ocean for school, trading one kind of uncertainty for another. Here, I found new rhythms and glimpses of belonging, but beneath the surface ran the same undercurrent: a restlessness that a busy schedule could not quite fill, a longing that a packed calendar could not quite answer.</p>
      <p>Out of that restlessness came Starry Night, an event organized by our school's Chinese Student Association to gather those of us scattered across the unfamiliar grounds. Before picking up my camera, I thought I already knew what I would find– nostalgia, homesickness, the quiet ache of displacement. But what the lens revealed was something harder to predict: the way a stranger's laughter can sound familiar, how a single unguarded expression holds an entire journey within it.</p>
      <p>Starry Night became less about the event itself and more about the faces, rather each one a different answer to the same question of how we learn to belong.</p>
      <p>October 16, 2025</p>
    </ProjectGallery>
  )
}
