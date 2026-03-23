import { Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

const EXT = 12
const MX = x => -x

function interp(x1, a1, x2, a2, x) {
  const d = x2 - x1
  if (Math.abs(d) < 1e-10) return a1
  return a1 + (a2 - a1) * (x - x1) / d
}

function makeSurface(poly) {
  if (poly.length < 3) return null
  const verts = []
  for (let i = 1; i < poly.length - 1; i++) {
    verts.push(...poly[0], ...poly[i], ...poly[i + 1])
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  geo.computeVertexNormals()
  return geo
}

export default function PlaneEntity({ plano }) {
  const { trazaH, trazaV, color, nombre, tipo } = plano

  const hAt = x => trazaH ? interp(trazaH.x1, trazaH.y1, trazaH.x2, trazaH.y2, x) : 0
  const vAt = x => trazaV ? interp(trazaV.x1, trazaV.z1, trazaV.x2, trazaV.z2, x) : 0

  const geo = useMemo(() => {
    let poly = null

    switch (tipo) {

      case 'oblicuo': {
        const dyH = trazaH.y2 - trazaH.y1, dxH = trazaH.x2 - trazaH.x1
        const vx = Math.abs(dyH) > 1e-10
          ? trazaH.x1 - trazaH.y1 * dxH / dyH
          : trazaH.x1
        // Dirección de la traza oblicua respecto a V
        const dirX = trazaH.x2 - vx
        const farX = vx + (dirX >= 0 ? EXT : -EXT)
        poly = [
          [MX(vx),   0,          0],
          [MX(farX), 0,         -hAt(farX)],
          [MX(farX), vAt(farX),  0],
        ]
        break
      }

      case 'proyectanteH': {
        // α2 perpendicular a LT en PV (x=vx), α1 oblicua en PH
        const vx = trazaV.x1
        const dirX = trazaH.x2 - vx
        const farX = vx + (dirX >= 0 ? EXT : -EXT)
        const zFar = -hAt(farX)
        // Superficie: desde V en LT → extremo α1 en suelo → arriba → cima α2
        poly = [
          [MX(vx),   0,    0],
          [MX(farX), 0,    zFar],
          [MX(farX), EXT,  zFar],
          [MX(vx),   EXT,  0],
        ]
        break
      }

      case 'proyectanteV': {
        // α1 perpendicular a LT en PH (x=vx), α2 oblicua en PV
        const vx = trazaH.x1
        const dirX = trazaV.x2 - vx
        const farX = vx + (dirX >= 0 ? EXT : -EXT)
        const yFar = vAt(farX)
        // Superficie: V → fondo PH → esquina → sobre PV
        poly = [
          [MX(vx),   0,     0],
          [MX(vx),   0,    -EXT],
          [MX(farX), yFar, -EXT],
          [MX(farX), yFar,  0],
        ]
        break
      }

      case 'perfil': {
        const vx = trazaH.x1
        poly = [
          [MX(vx), 0,    0],
          [MX(vx), 0,   -EXT],
          [MX(vx), EXT, -EXT],
          [MX(vx), EXT,  0],
        ]
        break
      }

      case 'paralelosPH': {
        const cota = trazaV.z1
        poly = [
          [MX(-EXT), cota,  0],
          [MX( EXT), cota,  0],
          [MX( EXT), cota, -EXT],
          [MX(-EXT), cota, -EXT],
        ]
        break
      }

      case 'paralelosPV': {
        const alej = trazaH.y1
        poly = [
          [MX(-EXT), 0,   -alej],
          [MX( EXT), 0,   -alej],
          [MX( EXT), EXT, -alej],
          [MX(-EXT), EXT, -alej],
        ]
        break
      }

      case 'paraleloLT': {
        const alej = trazaH.y1
        const cota = trazaV.z1
        poly = [
          [MX(-EXT), 0,    -alej],
          [MX( EXT), 0,    -alej],
          [MX( EXT), cota,  0],
          [MX(-EXT), cota,  0],
        ]
        break
      }

      case 'porLT': {
        poly = [
          [MX(-EXT), 0,    0],
          [MX( EXT), 0,    0],
          [MX( EXT), EXT, -EXT],
          [MX(-EXT), EXT, -EXT],
        ]
        break
      }

      default:
        return null
    }

    if (!poly || poly.length < 3) return null
    return makeSurface(poly)
  }, [tipo, trazaH, trazaV])

  const lineaH = useMemo(() => {
    if (!trazaH || tipo === 'porLT') return null
    const dx = trazaH.x2 - trazaH.x1
    if (Math.abs(dx) < 1e-10) {
      return [[MX(trazaH.x1), 0, 0], [MX(trazaH.x1), 0, -EXT]]
    }
    return [
      [MX(-EXT), 0, -hAt(-EXT)],
      [MX( EXT), 0, -hAt( EXT)],
    ]
  }, [trazaH, tipo])

  const lineaV = useMemo(() => {
    if (!trazaV || tipo === 'porLT') return null
    const dx = trazaV.x2 - trazaV.x1
    if (Math.abs(dx) < 1e-10) {
      return [[MX(trazaV.x1), 0, 0], [MX(trazaV.x1), EXT, 0]]
    }
    return [
      [MX(-EXT), vAt(-EXT), 0],
      [MX( EXT), vAt( EXT), 0],
    ]
  }, [trazaV, tipo])

  const puntoV = useMemo(() => {
    if (!trazaH || !trazaV) return null
    if (['paraleloLT','paralelosPH','paralelosPV','porLT'].includes(tipo)) return null
    const dyH = trazaH.y2 - trazaH.y1
    const dxH = trazaH.x2 - trazaH.x1
    if (Math.abs(dxH) < 1e-10) return [MX(trazaH.x1), 0, 0]
    if (Math.abs(dyH) < 1e-10) return [MX(trazaH.x1), 0, 0]
    const vx = trazaH.x1 - trazaH.y1 * dxH / dyH
    return [MX(vx), 0, 0]
  }, [trazaH, trazaV, tipo])

  return (
    <group>
      {geo && (
        <mesh geometry={geo}>
          <meshBasicMaterial color={color} transparent opacity={0.25}
            side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {lineaH && (
        <>
          <Line points={lineaH} color={color} lineWidth={3} />
          <Text position={[MX(-EXT)-0.4, 0.15, lineaH[1][2]+0.1]}
            fontSize={0.3} color={color} anchorX="right">{nombre}₁</Text>
        </>
      )}
      {lineaV && (
        <>
          <Line points={lineaV} color={color} lineWidth={3} />
          <Text position={[MX(-EXT)-0.4, lineaV[1][1]+0.15, 0.1]}
            fontSize={0.3} color={color} anchorX="right">{nombre}₂</Text>
        </>
      )}
      {puntoV && (
        <mesh position={puntoV}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
      {tipo === 'porLT' && (
        <Text position={[0.3, 0.2, 0.1]} fontSize={0.28} color={color} anchorX="left">
          {nombre} ∈ LT
        </Text>
      )}
    </group>
  )
}