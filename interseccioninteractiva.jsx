import React, { useMemo, useState } from 'react'
import { Line, Text, TransformControls } from '@react-three/drei'
import * as THREE from 'three'

// Función interna para calcular el corte de trazas
function hallarCorte(r1, r2, offset1, offset2) {
  const x1 = r1.x1 + offset1, y1 = r1.y1 !== undefined ? r1.y1 : r1.z1
  const x2 = r1.x2 + offset1, y2 = r1.y2 !== undefined ? r1.y2 : r1.z2
  const x3 = r2.x1 + offset2, y3 = r2.y1 !== undefined ? r2.y1 : r2.z1
  const x4 = r2.x2 + offset2, y4 = r2.y2 !== undefined ? r2.y2 : r2.z2

  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(den) < 1e-10) return null

  const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den
  const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den
  return { x: px, y: py }
}

export default function InterseccionInteractiva({ plano1, plano2 }) {
  const [posX1, setPosX1] = useState(0)
  const [posX2, setPosX2] = useState(2) // Empezamos con el segundo un poco desplazado

  // Cálculo de la recta de intersección en tiempo real
  const recta = useMemo(() => {
    if (!plano1 || !plano2) return null
    const h = hallarCorte(plano1.trazaH, plano2.trazaH, posX1, posX2)
    const v = hallarCorte(plano1.trazaV, plano2.trazaV, posX1, posX2)
    if (!h || !v) return null
    return { points: [[h.x, h.y, 0], [v.x, 0, v.y]], h, v }
  }, [plano1, plano2, posX1, posX2])

  return (
    <group>
      {/* PLANO 1 - Arrastrable */}
      <TransformControls 
        mode="translate" 
        showY={false} showZ={false} // Solo movemos en el eje X (Línea de Tierra)
        position={[posX1, 0, 0]}
        onChange={(e) => setPosX1(e.target.object.position.x)}
      >
        <mesh>
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial color="orange" transparent opacity={0.3} side={2} />
        </mesh>
      </TransformControls>

      {/* PLANO 2 - Arrastrable */}
      <TransformControls 
        mode="translate" 
        showY={false} showZ={false} 
        position={[posX2, 0, 0]}
        onChange={(e) => setPosX2(e.target.object.position.x)}
      >
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial color="royalblue" transparent opacity={0.3} side={2} />
        </mesh>
      </TransformControls>

      {/* RECTA DE INTERSECCIÓN (Cian) */}
      {recta && (
        <group>
          <Line points={recta.points} color="#00ffff" lineWidth={5} />
          <mesh position={recta.points[0]}><sphereGeometry args={[0.08]} /><meshBasicMaterial color="#00ffff" /></mesh>
          <mesh position={recta.points[1]}><sphereGeometry args={[0.08]} /><meshBasicMaterial color="#00ffff" /></mesh>
          <Text position={recta.points[0]} fontSize={0.2} color="white" anchorY="top">h</Text>
          <Text position={recta.points[1]} fontSize={0.2} color="white" anchorX="left">v'</Text>
        </group>
      )}
    </group>
  )
}