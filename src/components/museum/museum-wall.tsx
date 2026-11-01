'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export type MuseumItem = {
  image: string
  width: number
  height: number
  offsetY: number
  aspect: number
}

export function fitPhotoWithinBounds(boundsWidth: number, boundsHeight: number, aspect: number) {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : boundsWidth / boundsHeight
  if (boundsWidth / safeAspect <= boundsHeight) {
    return { width: boundsWidth, height: boundsWidth / safeAspect }
  }
  return { width: boundsHeight * safeAspect, height: boundsHeight }
}

type Props = {
  items: MuseumItem[]
  selected: number
  onSelect: (index: number) => void
  reduced: boolean
  fallbackClass: string
  onReady?: () => void
}

const SPACING = 3

export function MuseumWall({ items, selected, onSelect, reduced, fallbackClass, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectedRef = useRef(selected)
  const reducedRef = useRef(reduced)
  const onSelectRef = useRef(onSelect)
  const onReadyRef = useRef(onReady)
  const [failed, setFailed] = useState(false)

  selectedRef.current = selected
  reducedRef.current = reduced
  onSelectRef.current = onSelect
  onReadyRef.current = onReady

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setFailed(true)
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(0, 0.28, 6.1)
    camera.lookAt(0, 0, 0)

    const centerIndex = (items.length - 1) / 2
    const photosGroup = new THREE.Group()
    photosGroup.position.y = 0.12
    const photos: THREE.Group[] = []
    let remaining = items.length
    let readyCalled = false
    let disposed = false
    const markLoaded = () => {
      remaining -= 1
      if (remaining <= 0 && !readyCalled && !disposed) {
        readyCalled = true
        onReadyRef.current?.()
      }
    }
    photosGroup.position.x = -(selectedRef.current - centerIndex) * SPACING
    scene.add(photosGroup)

    items.forEach((item, index) => {
      const photo = new THREE.Group()
      photo.position.set((index - centerIndex) * SPACING, item.offsetY, 0)
      photo.userData.index = index

      const fit = fitPhotoWithinBounds(item.width, item.height, item.aspect)
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false })
      const art = new THREE.Mesh(new THREE.PlaneGeometry(fit.width, fit.height), material)
      art.position.z = 0
      photo.add(art)

      const loader = new THREE.TextureLoader()
      loader.load(item.image, (texture) => {
        if (disposed) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 4
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        material.map = texture
        material.opacity = 1
        material.needsUpdate = true
        markLoaded()
      }, undefined, () => {
        if (!disposed) markLoaded()
      })

      photos.push(photo)
      photosGroup.add(photo)
    })

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const pointer = { x: 0, y: 0 }
    let wheelLock = 0
    let frameId = 0
    const clock = new THREE.Clock()

    const fitDepth = (item: MuseumItem) => {
      const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
      const targetWidth = camera.aspect < 1.2 ? 0.92 : 0.8
      const zForWidth = item.width / (2 * halfFov * camera.aspect * targetWidth)
      const targetHeight = camera.aspect < 1.2 ? 0.64 : 0.70
      const zForHeight = item.height / (2 * halfFov * targetHeight)
      return Math.max(zForWidth, zForHeight)
    }

    const resize = () => {
      const parent = canvas.parentElement
      const width = Math.max(1, parent?.clientWidth ?? canvas.clientWidth)
      const height = Math.max(1, parent?.clientHeight ?? canvas.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.position.z = fitDepth(items[selectedRef.current] ?? items[0])
      camera.updateProjectionMatrix()
    }

    const move = (direction: number) => {
      const next = Math.max(0, Math.min(items.length - 1, selectedRef.current + direction))
      if (next !== selectedRef.current) onSelectRef.current(next)
    }

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      ndc.set(pointer.x, pointer.y)
      raycaster.setFromCamera(ndc, camera)
      canvas.style.cursor = raycaster.intersectObjects(photos, true).length ? 'pointer' : 'default'
    }

    const clearPointer = () => {
      pointer.x = 0
      pointer.y = 0
      canvas.style.cursor = 'default'
    }

    let dragStartX = 0
    let dragStartY = 0
    let dragging = false
    let suppressClick = false

    const pointerDown = (event: PointerEvent) => {
      canvas.focus()
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is optional; drags still end on pointerup inside the canvas.
      }
      dragStartX = event.clientX
      dragStartY = event.clientY
      dragging = true
      suppressClick = false
    }

    const pointerUp = (event: PointerEvent) => {
      dragging = false
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      } catch {
        // The pointer may already be released by the browser.
      }
    }

    const pointerDrag = (event: PointerEvent) => {
      setPointer(event)
      if (!dragging) return
      const distanceX = event.clientX - dragStartX
      const distanceY = event.clientY - dragStartY
      if (Math.abs(distanceX) > 42 && Math.abs(distanceX) > Math.abs(distanceY)) {
        dragging = false
        suppressClick = true
        move(distanceX < 0 ? 1 : -1)
      }
    }

    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        move(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        move(1)
      }
    }

    const click = (event: PointerEvent) => {
      if (suppressClick) {
        suppressClick = false
        return
      }
      setPointer(event)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(photos, true)[0]
      let node: THREE.Object3D | null = hit?.object ?? null
      while (node && node.userData.index === undefined) node = node.parent
      if (node) onSelectRef.current(Number(node.userData.index))
    }

    const wheel = (event: WheelEvent) => {
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey
      if (!horizontal) return
      event.preventDefault()
      if (Date.now() < wheelLock) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (Math.abs(delta) < 8) return
      wheelLock = Date.now() + 380
      move(delta > 0 ? 1 : -1)
    }

    const render = () => {
      frameId = requestAnimationFrame(render)
      const delta = Math.min(clock.getDelta(), 0.05)
      const lambda = reducedRef.current ? 1000 : 6
      const targetX = -(selectedRef.current - centerIndex) * SPACING
      const selectedItem = items[selectedRef.current] ?? items[0]
      const targetZ = fitDepth(selectedItem)
      photosGroup.position.x = THREE.MathUtils.damp(photosGroup.position.x, targetX, lambda, delta)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, reducedRef.current ? 1000 : 4, delta)
      if (!reducedRef.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.24, 4, delta)
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.28 + pointer.y * 0.1, 4, delta)
        camera.lookAt(0, 0, 0)
      }
      photos.forEach((group, index) => {
        const chosen = index === selectedRef.current
        group.position.z = THREE.MathUtils.damp(group.position.z, chosen ? 0.22 : 0, lambda, delta)
        group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, chosen ? 1.025 : 1, lambda, delta))
      })
      renderer.render(scene, camera)
    }

    resize()
    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    canvas.addEventListener('pointerdown', pointerDown)
    canvas.addEventListener('pointerup', pointerUp)
    canvas.addEventListener('pointercancel', pointerUp)
    canvas.addEventListener('pointermove', pointerDrag)
    canvas.addEventListener('pointerleave', clearPointer)
    canvas.addEventListener('click', click)
    canvas.addEventListener('keydown', keyDown)
    canvas.addEventListener('wheel', wheel, { passive: false })
    frameId = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerUp)
      canvas.removeEventListener('pointermove', pointerDrag)
      canvas.removeEventListener('pointerleave', clearPointer)
      canvas.removeEventListener('click', click)
      canvas.removeEventListener('keydown', keyDown)
      canvas.removeEventListener('wheel', wheel)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((entry) => {
            const map = (entry as THREE.MeshBasicMaterial).map
            if (map) map.dispose()
            entry.dispose()
          })
        }
      })
      renderer.dispose()
    }
  }, [items])

  if (failed) return <div className={fallbackClass}>3D museum preview unavailable.</div>
  return <canvas ref={canvasRef} className="museum-canvas" role="img" tabIndex={0} data-presentation="photos-only" data-fit="contain" data-count={items.length} aria-label="Photographs on a gallery wall. Use the left and right arrow keys to move between photographs." style={{ display: 'block', width: '100%', height: '100%', touchAction: 'pan-y' }} />
}
