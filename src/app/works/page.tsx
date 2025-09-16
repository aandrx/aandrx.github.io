import Link from 'next/link'
import Image from 'next/image'

const projects = [
  {
    id: 1,
    title: 'Project One',
    image: '/placeholder-1.jpg',
    href: '/works/project-one'
  },
  {
    id: 2,
    title: 'Project Two',
    image: '/placeholder-2.jpg',
    href: '/works/project-two'
  },
  {
    id: 3,
    title: 'Project Three',
    image: '/placeholder-3.jpg',
    href: '/works/project-three'
  },
  {
    id: 4,
    title: 'Project Four',
    image: '/placeholder-4.jpg',
    href: '/works/project-four'
  },
  {
    id: 5,
    title: 'Project Five',
    image: '/placeholder-5.jpg',
    href: '/works/project-five'
  },
  {
    id: 6,
    title: 'Project Six',
    image: '/placeholder-6.jpg',
    href: '/works/project-six'
  }
]

export default function WorksPage() {
  return (
    <div className="container">
      <div className="text-center mb-12">
        <Link href="/" className="nav-link">
          ← Back
        </Link>
      </div>
      
      <div className="grid grid-3">
        {projects.map((project) => (
          <Link key={project.id} href={project.href} className="card">
            <div className="mb-4">
              <Image
                src={project.image}
                alt={project.title}
                width={400}
                height={300}
                className="w-full h-auto"
              />
            </div>
            <h3 className="subtitle text-center">{project.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  )
}
