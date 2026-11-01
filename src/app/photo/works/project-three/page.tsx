import './project-three.css'
import ProjectGallery from '@/components/ProjectGallery'

// Edit this folder and add filenames here (without extensions). Register the
// matching photos in src/data/image-sources.json before adding them.
const folder = 'nightfind-2024-09-24-25'
const imageFilenames: string[] = [
  // Add your image filenames here without extensions
]

const images = imageFilenames.map((filename) => ({
  src: `${folder}/${filename}`,
  alt: `Project Three ${filename}`,
}))

export default function ProjectThreePage() {
  return (
    <ProjectGallery title="Project Three" layoutClass="project-three-layout" images={images}>
      <p>Add your project description here.</p>
      <p>You can add multiple paragraphs to describe your project.</p>
      <p>Update the content and the image filenames array above.</p>
    </ProjectGallery>
  )
}
