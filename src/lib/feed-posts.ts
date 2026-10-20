import source from '@/data/feed-posts.json'
import palettesJson from '@/data/post-palettes.json'

export interface FeedPost {
  id: number
  images: string[]
  cover: string
  alt: string
  label?: string
  colors: string[]
}
const palettes: Record<string, { keys: string[]; colors: string[] }> = palettesJson

export const feedPosts: FeedPost[] = source.map((post) => {
  const images = post.filenames.map((filename) => `${post.folder}/${filename}`)
  const stored = palettes[post.id]
  if (!stored || JSON.stringify(stored.keys) !== JSON.stringify(images)) {
    throw new Error(`Post ${post.id} changed. Run npm run images:generate to update its palette.`)
  }
  return { ...post, images, cover: `${post.folder}/${post.cover}`, colors: stored.colors }
})
