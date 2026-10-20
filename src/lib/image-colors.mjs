// Shared by the publishing script and the metadata-only API.
// Keep these scoring rules identical for generated and on-demand palettes.
/** @param {number} channel */
export const quantize = (channel) => Math.min(255, Math.max(0, Math.round(channel / 24) * 24))

/** @param {string} key */
export const toHex = (key) => '#' + key.split(',').map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase()

/** @param {[string, number]} entry */
export function perImageColorScore([key, count]) {
  const [r, g, b] = key.split(',').map(Number)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const mid = r + g + b - max - min
  const chroma = (max - min) / 255
  const purity = (max - mid) / 255
  return Math.sqrt(count) * (0.1 + 2.6 * chroma + 1.6 * chroma * purity)
}

/** @param {Map<string, number>} histogram */
export function dominantColor(histogram) {
  const top = [...histogram].sort((a, b) => perImageColorScore(b) - perImageColorScore(a))[0]
  return top ? toHex(top[0]) : ''
}

/** @param {Map<string, number>} histogram */
export function palette(histogram) {
  const score = ([key, count]) => {
    const [r, g, b] = key.split(',').map(Number)
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return count * (0.2 + 2.4 * chroma + 0.7 * luma)
  }
  return [...histogram].sort((a, b) => score(b) - score(a)).slice(0, 5).map(([key]) => toHex(key))
}

/** @param {Array<Array<[string, number]>>} histograms */
export function combineHistograms(histograms) {
  const combined = new Map()
  for (const histogram of histograms) {
    for (const [key, count] of histogram) combined.set(key, (combined.get(key) || 0) + count)
  }
  return combined
}
