import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PROJECT_ENTRIES, getNextProject, getProject } from '@/lib/project-data'
import ProjectArticle from './project-article'

type Props = {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return PROJECT_ENTRIES.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return {}
  return {
    title: `${project.title} · Andrew Liu`,
    description: project.detail,
    alternates: {
      canonical: `/projects/${project.slug}/`,
    },
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  return <ProjectArticle project={project} next={getNextProject(slug)} />
}
