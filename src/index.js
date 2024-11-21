import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import * as THREE from 'three'
import { Canvas } from 'react-three-fiber'
import { Tetrahedron, Box, Octahedron, Polyhedron, Dodecahedron, Icosahedron } from '@react-three/drei'
import { Physics, usePlane, useBox, useConvexPolyhedron } from 'use-cannon'
import niceColors from 'nice-color-palettes'
import './styles.css'

const textColor = 'white'
const dieColor = 'indigo'

const calculateTextureSize = (approx) => {
  return Math.max(128, Math.pow(2, Math.floor(Math.log(approx) / Math.log(2))))
}

const createTextTexture = (text, color, backColor) => {
  console.log(text, color, backColor)

  // TODO Set size/textMargin for each shape
  const size = 100
  const textMargin = 1

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const ts = calculateTextureSize(size / 2 + size * textMargin) * 2
  canvas.width = canvas.height = ts
  context.font = ts / (1 + 2 * textMargin) + 'pt Arial'
  context.fillStyle = backColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = color
  context.fillText(text, canvas.width / 2, canvas.height / 2)

  if (text === 6 || text === 9) {
    context.fillText('  .', canvas.width / 2, canvas.height / 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

const Plane = ({ color, ...props }) => {
  const [ref] = usePlane(() => ({ ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[1000, 1000]} />
      <meshPhongMaterial attach="material" color={color} />
    </mesh>
  )
}

const D6 = (props) => {
  const sides = 6
  const radius = 2.5
  const [ref, api] = useBox(() => ({ args: [radius, radius, radius], mass: 1, ...props }))

  const handleClick = (e) => {
    // Raycasting to check which side is clicked
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // Get mouse position from the event
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

    // Set up raycaster to get intersection with the cube
    raycaster.setFromCamera(mouse, e.camera)

    // Find intersections with the cube
    const intersects = raycaster.intersectObject(ref.current)

    if (intersects.length > 0) {
      const intersectedFace = intersects[0].face
      const normal = intersectedFace.normal

      // Determine which face was clicked based on the normal vector
      let clickedSide = ''

      if (normal.y > 0) {
        clickedSide = 'Top 3' // If the normal is pointing upwards, it's the top face
      } else if (normal.y < 0) {
        clickedSide = 'Bottom 4' // If the normal is pointing downwards, it's the bottom face
      } else if (normal.x > 0) {
        clickedSide = 'Right 1' // If the normal is pointing to the right, it's the right face
      } else if (normal.x < 0) {
        clickedSide = 'Left 2' // If the normal is pointing to the left, it's the left face
      } else if (normal.z > 0) {
        clickedSide = 'Front 5' // If the normal is pointing towards the viewer, it's the front face
      } else if (normal.z < 0) {
        clickedSide = 'Back 6' // If the normal is pointing away from the viewer, it's the back face
      }

      console.log(`Clicked on the ${clickedSide} side.`) // Log the side clicked
    }

    // Apply impulse to move the object
    api.applyImpulse([0, 20, 0], [0, 0, 0])
  }

  return (
    <>
      <Box args={[radius, radius, radius]} ref={ref} onClick={handleClick} castShadow receiveShadow>
        {Array.from(Array(sides)).map((_, i) => (
          <meshPhongMaterial attachArray="material" map={createTextTexture(i + 1, textColor, dieColor)} key={i} />
        ))}
      </Box>
    </>
  )
}

ReactDOM.render(
  <Canvas concurrent shadowMap sRGB gl={{ alpha: false }} camera={{ position: [0, -12, 16] }}>
    <hemisphereLight intensity={0.35} />
    <spotLight position={[30, 0, 30]} angle={0.3} penumbra={1} intensity={2} castShadow shadow-mapSize-width={256} shadow-mapSize-height={256} />
    <pointLight position={[-30, 0, -30]} intensity={0.5} />
    <Physics gravity={[0, 0, -30]}>
      <Plane color={niceColors[17][4]} />
      <Plane color={niceColors[17][1]} position={[-10, 0, 0]} rotation={[0, 1, 0]} />
      <Plane color={niceColors[17][2]} position={[10, 0, 0]} rotation={[0, -1, 0]} />
      <Plane color={niceColors[17][3]} position={[0, 10, 0]} rotation={[1, 0, 0]} />
      <Plane color={niceColors[17][0]} position={[0, -10, 0]} rotation={[-1, 0, 0]} />

      <D6 position={[0, 0, 2]} />
    </Physics>
  </Canvas>,
  document.getElementById('root')
)
