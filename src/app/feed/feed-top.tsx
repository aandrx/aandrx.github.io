import Link from 'next/link'

export default function FeedTop() {
  return (
    <header className="feed-top">
      <Link className="feed-name" href="/">Andrew Liu.</Link>
      <nav className="feed-nav" aria-label="Feed navigation">
        <Link className="feed-pill" href="/#projects">Work</Link>
        <Link className="feed-pill" href="/feed/" aria-current="page">Feed</Link>
        <Link className="feed-pill" href="/photo/">Photo</Link>
      </nav>
    </header>
  )
}
