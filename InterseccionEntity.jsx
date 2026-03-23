import { useMemo } from 'react'
import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'

// Función matemática auxiliar para hallar el corte de dos rectas
function hallarCorte(r1, r2) {
  const x1 = r1.x1, y1 = r1.y1 !== undefined ? r1.y1 : r1.z1
  const x2 = r1.x2, y2 = r1.y2 !== undefined ? r1.y2 : r1.z2
  const x3 = r2.x1, y3 = r2.y1 !== undefined ? r2.y1 : r2.z1
  const x4 = r2.x2, y4 = r2.y2 !== undefined ? r2.y2 : r2.z2

  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(den) < 1e-10) return null // Son paralelas

  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den

  return { x: px, y: py }
}

export default function InterseccionEntity({ plano1, plano2 }) {
  const datosRecta = useMemo(() => {
    if (!plano1 || !plano2) return null

    // 1. Hallar H (Intersección de trazas horizontales en el suelo Z=0)
    const corteH = hallarCorte(plano1.trazaH, plano2.trazaH)
    
    // 2. Hallar V (Intersección de trazas verticales en la pared Y=0)
    const corteV = hallarCorte(plano1.trazaV, plano2.trazaV)

    if (!corteH || !corteV) return null

    const pH = [corteH.x, corteH.y, 0] // Traza horizontal de la recta
    const pV = [corteV.x, 0, corteV.y] // Traza vertical de la recta (y es Z en 3D)

    return { points: [pH, pV], pH, pV }
  }, [plano1, plano2])

  if (!datosRecta) return null

  return (
    <group>
      {/* La recta de intersección 'i' */}
      <Line 
        points={datosRecta.points} 
        color="#00ffff" 
        lineWidth={4} 
      />

      {/* Etiquetas de las trazas de la recta */}
      <Text position={datosRecta.pH} fontSize={0.2} color="white" anchorY="top">h</Text>
      <Text position={datosRecta.pV} fontSize={0.2} color="white" anchorX="left">v'</Text>

      {/* Puntos visuales (esferas) en las trazas */}
      <mesh position={datosRecta.pH}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
      <mesh position={datosRecta.pV}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  )
}