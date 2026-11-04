import Link from 'next/link'

export default function ProjectsTop() {
  return (
    <header className="feed-top">
      <Link className="feed-name" href="/">Andrew Liu.</Link>
      <nav className="feed-nav" aria-label="Projects navigation">
        <Link className="feed-pill" href="/projects/" aria-current="page">Work</Link>
        <Link className="feed-pill" href="/feed/">Feed</Link>
        <Link className="feed-pill" href="/photo/">Photo</Link>
      </nav>
    </header>
  )
}
