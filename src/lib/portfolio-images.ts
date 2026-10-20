import metadataJson from '@/data/image-metadata.json'

export const IMAGE_ORIGIN = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

export interface ImageVariant {
  size: number
  width: number
  height: number
  src: string
  revision: string
}
export interface PortfolioAsset {
  width: number
  height: number
  color: string
  variants: ImageVariant[]
}
const metadata: Record<string, PortfolioAsset> = metadataJson

export function imageKey(src: string): string {
  if (!src.startsWith('https://')) return src.replace(/^\//, '').replace(/-(720|1920)w\.webp$/, '')
  const url = new URL(src)
  if (url.origin !== IMAGE_ORIGIN) throw new Error('Unregistered image origin')
  return url.pathname.slice(1).replace(/-(720|1920)w\.webp$/, '')
}

export function getPortfolioAsset(src: string): PortfolioAsset {
  const key = imageKey(src)
  const asset = metadata[key]
  if (!asset) throw new Error(`Missing metadata for ${key}. Run npm run images:generate after registering the image.`)
  return asset
}

export function imageSizes(asset: PortfolioAsset, mode: 'gallery' | 'carousel'): string {
  const ratio = asset.width / asset.height
  if (mode === 'gallery') return `(max-width: 768px) calc(100vw - 40px), ${75 * ratio}vh`
  return `min(${58 * ratio}vh, ${520 * ratio}px)`
}
