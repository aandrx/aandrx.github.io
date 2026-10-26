'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export type ThreeVariant = 'desk' | 'monolith' | 'cards' | 'orbit'

type Pointer = { x: number; y: number }

type BuiltScene = {
  root: THREE.Group
  interactive: THREE.Object3D[]
  update: (delta: number, selected: number, reduced: boolean, pointer: Pointer, elapsed: number) => void
}

const CAMERAS: Record<ThreeVariant, { fov: number; position: [number, number, number] }> = {
  desk: { fov: 31, position: [0, 0.3, 6.8] },
  monolith: { fov: 33, position: [0, 0.2, 7.2] },
  cards: { fov: 34, position: [0, 0.1, 6.4] },
  orbit: { fov: 32, position: [0, 0.1, 8.4] },
}

const CARD_TINTS = ['#eee5d4', '#d9e0d2', '#e8d9ce', '#d7dde5', '#e9e2d2']
const CARD_LABELS = [
  { title: 'Loom', meta: '01 / systems' },
  { title: 'sink', meta: '02 / tooling' },
  { title: 'HarmonyAPI', meta: '03 / api' },
  { title: 'Continuum', meta: '04 / infrastructure' },
  { title: 'Photography', meta: '05 / archive' },
]

function material(color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08, ...options })
}

function box(width: number, height: number, depth: number, color: THREE.ColorRepresentation, options?: THREE.MeshStandardMaterialParameters) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, options))
}

function plane(width: number, height: number, color: THREE.ColorRepresentation) {
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ color }))
}

function makeDesk(): BuiltScene {
  const root = new THREE.Group()
  root.position.y = 0.05

  const camera = new THREE.Group()
  camera.position.set(-1.5, 0.1, 0)
  const body = box(1.35, 0.78, 0.6, '#1d1b18', { roughness: 0.42, metalness: 0.18 })
  const top = box(0.5, 0.16, 0.42, '#2e2a24', { roughness: 0.4 })
  top.position.set(0, 0.46, 0)
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.3, 0.3, 32),
    new THREE.MeshPhysicalMaterial({ color: '#4e5e68', roughness: 0.18, metalness: 0.55, clearcoat: 0.7 }),
  )
  lens.rotation.x = Math.PI / 2
  lens.position.set(0.24, 0, 0.34)
  const shutter = box(0.12, 0.18, 0.03, '#b7aa93', { roughness: 0.5 })
  shutter.position.set(-0.48, 0.12, 0.31)
  camera.add(body, top, lens, shutter)
  camera.userData.index = 0

  const terminal = new THREE.Group()
  terminal.position.set(1.5, 0.05, -0.1)
  terminal.rotation.y = -0.35
  terminal.add(box(1, 0.74, 0.12, '#26241f', { roughness: 0.38, metalness: 0.2 }))
  const screen = plane(0.82, 0.54, '#10120f')
  screen.position.set(0, 0.02, 0.07)
  terminal.add(screen)
  ;[0.13, 0.02, -0.09, -0.2].forEach((y, index) => {
    const line = plane(index === 0 ? 0.35 : 0.25, 0.012, index === 0 ? '#d48b56' : '#5f7062')
    line.position.set(-0.18 + (index % 2) * 0.14, y, 0.08)
    terminal.add(line)
  })
  const stand = box(0.56, 0.1, 0.34, '#1b1a17', { roughness: 0.55 })
  stand.position.set(0, -0.43, 0)
  terminal.add(stand)
  terminal.userData.index = 1

  const prints = new THREE.Group()
  prints.position.set(0, -0.98, 0.55)
  prints.rotation.set(0.05, 0.12, 0)
  ;[0, 1, 2, 3].forEach((index) => {
    const print = box(0.9 - index * 0.03, 0.63 - index * 0.02, 0.025, index % 2 === 0 ? '#f1e9da' : '#d7cdbb', { roughness: 0.84 })
    print.position.set(index * 0.06, index * 0.035, index * 0.02)
    print.rotation.set(0, 0.03 * index, -0.06 + index * 0.035)
    prints.add(print)
  })
  prints.userData.index = 2

  root.add(camera, terminal, prints)

  const objects = [
    { group: camera, index: 0, baseY: 0.1, lift: 0.34, tilt: -0.08 },
    { group: terminal, index: 1, baseY: 0.05, lift: 0.32, tilt: 0.08 },
    { group: prints, index: 2, baseY: -0.98, lift: 0.28, tilt: -0.04 },
  ]

  return {
    root,
    interactive: [camera, terminal, prints],
    update(delta, selected, reduced, pointer) {
      const lambda = reduced ? 1000 : 6
      root.rotation.y = reduced ? 0 : THREE.MathUtils.damp(root.rotation.y, pointer.x * 0.16, 4, delta)
      root.rotation.x = reduced ? 0 : THREE.MathUtils.damp(root.rotation.x, -pointer.y * 0.08, 4, delta)
      for (const item of objects) {
        const chosen = item.index === selected
        item.group.position.y = THREE.MathUtils.damp(item.group.position.y, item.baseY + (chosen ? item.lift : 0), lambda, delta)
        item.group.rotation.z = THREE.MathUtils.damp(item.group.rotation.z, chosen ? item.tilt : 0, lambda, delta)
        item.group.scale.setScalar(THREE.MathUtils.damp(item.group.scale.x, chosen ? 1.04 : 1, lambda, delta))
      }
    },
  }
}

function makeMonolith(): BuiltScene {
  const root = new THREE.Group()
  root.rotation.set(0, 0.12, 0)
  const slabs: THREE.Group[] = []

  ;[0, 1, 2].forEach((index) => {
    const slab = new THREE.Group()
    slab.position.set((index - 1) * 1.45, 0, 0)
    slab.userData.index = index
    slab.add(box(1.05, 2.9, 0.18, '#181b1c', { roughness: 0.32, metalness: 0.62 }))
    const edge = plane(0.02, 2.45, '#3e4645')
    edge.position.set(0, 0, 0.095)
    slab.add(edge)
    ;[0.82, 0.35, -0.12, -0.6].forEach((y, line) => {
      const mark = plane(line % 2 === 0 ? 0.58 : 0.38, 0.008, '#313837')
      mark.position.set(0.1, y, 0.1)
      slab.add(mark)
    })
    const footer = plane(0.22, 0.012, '#68706b')
    footer.position.set(0, -1.24, 0.1)
    slab.add(footer)
    slabs.push(slab)
    root.add(slab)
  })

  return {
    root,
    interactive: slabs,
    update(delta, selected, reduced, pointer) {
      const lambda = reduced ? 1000 : 7
      root.rotation.y = reduced ? 0 : THREE.MathUtils.damp(root.rotation.y, pointer.x * 0.2, 4, delta)
      root.rotation.x = reduced ? 0 : THREE.MathUtils.damp(root.rotation.x, -pointer.y * 0.08, 4, delta)
      slabs.forEach((slab, index) => {
        const chosen = index === selected
        slab.position.z = THREE.MathUtils.damp(slab.position.z, chosen ? 0.62 : 0, lambda, delta)
        slab.rotation.y = THREE.MathUtils.damp(slab.rotation.y, chosen ? -0.13 : 0, lambda, delta)
        slab.scale.setScalar(THREE.MathUtils.damp(slab.scale.x, chosen ? 1.02 : 1, lambda, delta))
        const accent = chosen ? '#c7f36b' : '#313837'
        const live = slab.children[1] as THREE.Mesh
        ;(live.material as THREE.MeshBasicMaterial).color.set(accent)
      })
    },
  }
}

function labelTexture(title: string, meta: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const context = canvas.getContext('2d')
  if (!context) return null
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#211e1a'
  context.font = '44px Georgia, serif'
  context.fillText(title, 38, 92)
  context.fillStyle = '#826f5c'
  context.font = '20px monospace'
  context.fillText(meta.toUpperCase(), 40, 132)
  context.fillStyle = '#b25b3b'
  context.fillRect(40, 158, 70, 4)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function makeCards(): BuiltScene {
  const root = new THREE.Group()
  root.rotation.set(0.02, 0, 0)
  const cards: THREE.Group[] = []

  CARD_TINTS.forEach((tint, index) => {
    const card = new THREE.Group()
    card.position.set((index - 2) * 0.48, (index - 2) * 0.07, index * 0.035)
    card.rotation.set(0.04, (index - 2) * 0.045, (index - 2) * 0.035)
    card.userData.index = index
    card.add(box(1.45, 0.95, 0.035, tint, { roughness: 0.78, metalness: 0.02 }))
    const rule = plane(1.18, 0.012, '#9b8168')
    rule.position.set(0, -0.39, 0.022)
    card.add(rule)
    const notch = plane(0.18, 0.008, '#7a6652')
    notch.position.set(-0.51, 0.3, 0.023)
    card.add(notch)
    const texture = labelTexture(CARD_LABELS[index].title, CARD_LABELS[index].meta)
    if (texture) {
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.81), new THREE.MeshBasicMaterial({ map: texture, transparent: true }))
      label.position.set(0, 0.03, 0.024)
      card.add(label)
    }
    cards.push(card)
    root.add(card)
  })

  return {
    root,
    interactive: cards,
    update(delta, selected, reduced, pointer) {
      const lambda = reduced ? 1000 : 8
      root.rotation.y = reduced ? 0 : THREE.MathUtils.damp(root.rotation.y, pointer.x * 0.17, 4, delta)
      root.rotation.x = reduced ? 0.02 : THREE.MathUtils.damp(root.rotation.x, -pointer.y * 0.08 + 0.02, 4, delta)
      cards.forEach((card, index) => {
        const chosen = index === selected
        card.position.y = THREE.MathUtils.damp(card.position.y, chosen ? 0.28 : 0, lambda, delta)
        card.position.z = THREE.MathUtils.damp(card.position.z, chosen ? 1.12 : index * 0.035, lambda, delta)
        card.rotation.y = THREE.MathUtils.damp(card.rotation.y, chosen ? 0 : (index - 2) * 0.045, lambda, delta)
        card.rotation.z = THREE.MathUtils.damp(card.rotation.z, chosen ? 0 : (index - 2) * 0.035, lambda, delta)
        card.scale.setScalar(THREE.MathUtils.damp(card.scale.x, chosen ? 1.025 : 1, lambda, delta))
        const rule = card.children[1] as THREE.Mesh
        ;(rule.material as THREE.MeshBasicMaterial).color.set(chosen ? '#b25b3b' : '#9b8168')
      })
    },
  }
}

function makeOrbit(): BuiltScene {
  const root = new THREE.Group()
  root.rotation.set(0.18, 0.35, 0.04)
  const inner = new THREE.Group()
  root.add(inner)

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    material('#1d2b38', { roughness: 0.28, metalness: 0.62, flatShading: true }),
  )
  inner.add(core)

  ;[0, 1, 2].forEach((index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.7 + index * 0.1, 0.008, 8, 120),
      new THREE.MeshBasicMaterial({ color: index === 1 ? '#466da6' : '#8999a5', transparent: true, opacity: 0.5 }),
    )
    ring.rotation.set(Math.PI / 2 + index * 0.36, index * 0.7, index * 0.2)
    inner.add(ring)
  })

  const positions: [number, number, number][] = [
    [0.2, 1.72, 0.1],
    [1.62, 0.2, 0.5],
    [-1.55, -0.1, 0.42],
    [0.18, -1.68, -0.2],
    [-0.55, 1.05, -1.15],
  ]
  const colors = ['#2b5cff', '#d7ff64', '#ff8a5c', '#2b5cff', '#d7ff64']
  const nodes = positions.map((position, index) => {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 24, 24),
      material(colors[index], { emissive: colors[index], emissiveIntensity: 0.32, roughness: 0.3, metalness: 0.15 }),
    )
    node.position.set(...position)
    node.userData.index = index
    inner.add(node)
    return node
  })

  return {
    root,
    interactive: nodes,
    update(delta, selected, reduced, pointer) {
      const lambda = reduced ? 1000 : 8
      if (!reduced) root.rotation.y += delta * 0.055
      root.rotation.x = reduced ? 0.18 : THREE.MathUtils.damp(root.rotation.x, 0.18 - pointer.y * 0.08, 4, delta)
      inner.rotation.y = reduced ? 0 : THREE.MathUtils.damp(inner.rotation.y, pointer.x * 0.25, 4, delta)
      nodes.forEach((node, index) => {
        node.scale.setScalar(THREE.MathUtils.damp(node.scale.x, index === selected ? 1.65 : 1, lambda, delta))
        const live = node.material as THREE.MeshStandardMaterial
        live.emissiveIntensity = THREE.MathUtils.damp(live.emissiveIntensity, index === selected ? 1.3 : 0.32, lambda, delta)
      })
    },
  }
}

function addLights(scene: THREE.Scene, variant: ThreeVariant) {
  const settings = {
    desk: { ambient: [1.1, '#fff8eb'], directional: [2.1, '#fff2d8'], point: [7, '#d7e1ff'] },
    monolith: { ambient: [0.8, '#dfe8d0'], directional: [2.3, '#f4f0d9'], point: [8, '#50685a'] },
    cards: { ambient: [1.35, '#fffaf0'], directional: [2.2, '#fff5df'], point: [5, '#e7d9c2'] },
    orbit: { ambient: [1.2, '#edf4f6'], directional: [2.4, '#ffffff'], point: [6, '#a9c7ff'] },
  }[variant]

  scene.add(new THREE.AmbientLight(settings.ambient[1], settings.ambient[0] as number))
  const directional = new THREE.DirectionalLight(settings.directional[1], settings.directional[0] as number)
  directional.position.set(4, 6, 5)
  scene.add(directional)
  const point = new THREE.PointLight(settings.point[1], settings.point[0] as number)
  point.position.set(-4, 2, 3)
  scene.add(point)
}

export function ThreeStage({ variant, selected, onSelect, reduced, fallbackClass }: { variant: ThreeVariant; selected: number; onSelect: (index: number) => void; reduced: boolean; fallbackClass: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectedRef = useRef(selected)
  const reducedRef = useRef(reduced)
  const onSelectRef = useRef(onSelect)
  const pointerRef = useRef<Pointer>({ x: 0, y: 0 })
  const [failed, setFailed] = useState(false)

  selectedRef.current = selected
  reducedRef.current = reduced
  onSelectRef.current = onSelect

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      setFailed(true)
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05

    const cameraConfig = CAMERAS[variant]
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(cameraConfig.fov, 1, 0.1, 100)
    camera.position.set(...cameraConfig.position)
    addLights(scene, variant)
    const built = variant === 'desk' ? makeDesk() : variant === 'monolith' ? makeMonolith() : variant === 'cards' ? makeCards() : makeOrbit()
    scene.add(built.root)

    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let frame = 0
    const clock = new THREE.Clock()

    const resize = () => {
      const parent = canvas.parentElement
      const width = Math.max(1, parent?.clientWidth ?? canvas.clientWidth)
      const height = Math.max(1, parent?.clientHeight ?? canvas.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const setPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      pointerRef.current.x = x
      pointerRef.current.y = y
      ndc.set(x, y)
      raycaster.setFromCamera(ndc, camera)
      canvas.style.cursor = raycaster.intersectObjects(built.interactive, true).length ? 'pointer' : 'grab'
    }

    const clearPointer = () => {
      pointerRef.current.x = 0
      pointerRef.current.y = 0
      canvas.style.cursor = 'grab'
    }

    const clicked = (event: PointerEvent) => {
      setPointer(event)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(built.interactive, true)[0]
      let node: THREE.Object3D | null = hit?.object ?? null
      while (node && node.userData.index === undefined) node = node.parent
      if (node) onSelectRef.current(Number(node.userData.index))
    }

    const render = () => {
      frame = requestAnimationFrame(render)
      const delta = Math.min(clock.getDelta(), 0.05)
      built.update(delta, selectedRef.current, reducedRef.current, pointerRef.current, clock.elapsedTime)
      renderer.render(scene, camera)
    }

    resize()
    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)
    canvas.addEventListener('pointermove', setPointer)
    canvas.addEventListener('pointerleave', clearPointer)
    canvas.addEventListener('click', clicked)
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointermove', setPointer)
      canvas.removeEventListener('pointerleave', clearPointer)
      canvas.removeEventListener('click', clicked)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose())
          else object.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [variant])

  if (failed) return <div className={fallbackClass}>3D preview unavailable.</div>
  return <canvas ref={canvasRef} className="mock-three-canvas" role="img" aria-label={`Interactive ${variant} 3D scene`} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'pan-y' }} />
}
