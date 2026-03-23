import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line, Text, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import useDiedroStore from '../store/useDiedroStore'
import PlaneEntity from './PlaneEntity'

const COLOR_LT = '#ffffff'
const COLOR_PH = '#1a3a3a'
const COLOR_PV = '#1a2a3a'
const COLOR_PH_GRID = '#00ffcc22'
const COLOR_PV_GRID = '#00aaff22'
const COLOR_PUNTO = '#00ffcc'
const COLOR_PUNTO_OCULTO = '#ff6666'
const COLOR_RECTA = '#00ffcc'
const COLOR_RECTA_OCULTA = '#ff6666'
const COLOR_PROYECCION_H = '#00ccaa'
const COLOR_PROYECCION_V = '#0088ff'
const COLOR_TRAZA_H = '#ffff00'
const COLOR_TRAZA_V = '#ff8800'
const COLOR_REFERENCIA = '#ffffff44'

function PlanoHorizontal({ visible }) {
  if (!visible) return null
  return (
    <group>
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color={COLOR_PH} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[20, 20, COLOR_PH_GRID, COLOR_PH_GRID]} />
    </group>
  )
}

function PlanoVertical({ visible }) {
  if (!visible) return null
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color={COLOR_PV} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[20, 20, COLOR_PV_GRID, COLOR_PV_GRID]} />
    </group>
  )
}

function LineaTierra() {
  return (
    <>
      <Line points={[[-10, 0, 0], [10, 0, 0]]} color={COLOR_LT} lineWidth={2.5} />
      <Text position={[10.3, 0, 0]} fontSize={0.35} color={COLOR_LT} anchorX="left">LT</Text>
    </>
  )
}

function EjesReferencia({ visible }) {
  if (!visible) return null
  return (
    <group>
      <Line points={[[0, 0, 0], [3, 0, 0]]} color="#ff4444" lineWidth={1.5} />
      <Text position={[3.2, 0, 0]} fontSize={0.25} color="#ff4444">X</Text>
      <Line points={[[0, 0, 0], [0, 3, 0]]} color="#44ff44" lineWidth={1.5} />
      <Text position={[0, 3.2, 0]} fontSize={0.25} color="#44ff44">Y (cota)</Text>
      <Line points={[[0, 0, 0], [0, 0, -3]]} color="#4488ff" lineWidth={1.5} />
      <Text position={[0, 0, -3.4]} fontSize={0.25} color="#4488ff">Z (alej.)</Text>
    </group>
  )
}

function EtiquetasDiedros() {
  return (
    <group>
      <Text position={[0, 4, -4]} fontSize={0.45} anchorX="center" color="#00ffcc55">1er Diedro</Text>
      <Text position={[0, 4, 4]} fontSize={0.45} anchorX="center" color="#0088ff55">2do Diedro</Text>
      <Text position={[0, -4, 4]} fontSize={0.45} anchorX="center" color="#ff666655">3er Diedro</Text>
      <Text position={[0, -4, -4]} fontSize={0.45} anchorX="center" color="#ffaa0055">4to Diedro</Text>
    </group>
  )
}

function PuntoConProyecciones({ punto, mostrarReferencias }) {
  const { x, y, z, nombre } = punto
  const visible = y >= 0 && z >= 0
  const colorPunto = visible ? COLOR_PUNTO : COLOR_PUNTO_OCULTO

  // Three.js: Y=cota (igual), Z=-alejamiento (invertido)
  const pos   = [x,  y, -z]
  const proyH = [x,  0, -z]  // cota=0
  const proyV = [x,  y,  0]  // alejamiento=0

  return (
    <group>
      <mesh position={pos}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={colorPunto} />
      </mesh>
      <Text position={[x + 0.2, y + 0.2, -z + 0.1]} fontSize={0.28} color={colorPunto}>{nombre}</Text>

      {mostrarReferencias && (
        <>
          <Line points={[pos, proyH]} color={COLOR_REFERENCIA} lineWidth={1}
            dashed={!visible} dashScale={0.3} dashSize={0.1} />
          <Line points={[pos, proyV]} color={COLOR_REFERENCIA} lineWidth={1}
            dashed={!visible} dashScale={0.3} dashSize={0.1} />

          <mesh position={proyH}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color={COLOR_PROYECCION_H} />
          </mesh>
          <Text position={[x + 0.15, 0.15, -z + 0.15]} fontSize={0.22} color={COLOR_PROYECCION_H}>{nombre}″</Text>

          <mesh position={proyV}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color={COLOR_PROYECCION_V} />
          </mesh>
          <Text position={[x + 0.15, y + 0.1, 0.15]} fontSize={0.22} color={COLOR_PROYECCION_V}>{nombre}′</Text>

          <Line points={[[x, 0, 0], [x, y, 0]]} color={COLOR_REFERENCIA} lineWidth={0.8} dashed dashScale={0.2} dashSize={0.08} />
          <Line points={[[x, 0, 0], [x, 0, -z]]} color={COLOR_REFERENCIA} lineWidth={0.8} dashed dashScale={0.2} dashSize={0.08} />
        </>
      )}
    </group>
  )
}
function RectaConTrazas({ recta, puntos, mostrarReferencias }) {
  const pA = puntos.find(p => p.id === recta.puntoAId)
  const pB = puntos.find(p => p.id === recta.puntoBId)
  if (!pA || !pB) return null

  const EXT_T = 5 // extensión paramétrica
  const dy = pB.y - pA.y, dz = pB.z - pA.z, dx = pB.x - pA.x

  // Calcular t donde Y=0 y donde Z=0
  const t_H = Math.abs(dy) > 1e-10 ? -pA.y / dy : null  // Y=0 → traza H
  const t_V = Math.abs(dz) > 1e-10 ? -pA.z / dz : null  // Z=0 → traza V

  // Rango total extendido
  const tMin = -EXT_T, tMax = 1 + EXT_T

  // Puntos de corte ordenados
  const cortes = [tMin]
  if (t_H !== null) cortes.push(t_H)
  if (t_V !== null) cortes.push(t_V)
  cortes.push(tMax)
  cortes.sort((a, b) => a - b)

  // Función: punto 3D en t (en coordenadas Three.js)
  const punto3D = t => [
    pA.x + t * dx,
    pA.y + t * dy,
    -(pA.z + t * dz)
  ]

  // Función: ¿está en 1er diedro?
  const en1er = t => {
    const y = pA.y + t * dy
    const z = pA.z + t * dz
    return y >= 0 && z >= 0
  }

  // Segmentos entre cortes
  const segmentos = []
  for (let i = 0; i < cortes.length - 1; i++) {
    const tMid = (cortes[i] + cortes[i + 1]) / 2
    const visible = en1er(tMid)
    segmentos.push({
      p1: punto3D(cortes[i]),
      p2: punto3D(cortes[i + 1]),
      visible
    })
  }

  const posA = [pA.x, pA.y, -pA.z]
  const posB = [pB.x, pB.y, -pB.z]

  return (
    <group>
      {/* Segmentos con visibilidad correcta */}
      {segmentos.map((seg, i) => (
        <Line key={i}
          points={[seg.p1, seg.p2]}
          color={seg.visible ? COLOR_RECTA : COLOR_RECTA_OCULTA}
          lineWidth={seg.visible ? 2.5 : 1.5}
          dashed={!seg.visible}
          dashScale={0.3}
          dashSize={0.1}
        />
      ))}

      {mostrarReferencias && (
        <>
          {/* r — proyección en PH (y=0) */}
          <Line points={[
            [pA.x - dx * EXT_T, 0, -(pA.z - dz * EXT_T)],
            [pB.x + dx * EXT_T, 0, -(pB.z + dz * EXT_T)]
          ]} color={COLOR_PROYECCION_H} lineWidth={1.5} dashed dashScale={0.3} dashSize={0.1} />

          {/* r′ — proyección en PV (z=0) */}
          <Line points={[
            [pA.x - dx * EXT_T, pA.y - dy * EXT_T, 0],
            [pB.x + dx * EXT_T, pB.y + dy * EXT_T, 0]
          ]} color={COLOR_PROYECCION_V} lineWidth={1.5} dashed dashScale={0.3} dashSize={0.1} />

          <Line points={[posA, [posA[0], 0, posA[2]]]} color={COLOR_REFERENCIA} lineWidth={0.8} dashed dashScale={0.2} dashSize={0.08} />
          <Line points={[posA, [posA[0], posA[1], 0]]} color={COLOR_REFERENCIA} lineWidth={0.8} dashed dashScale={0.2} dashSize={0.08} />
          <Line points={[posB, [posB[0], 0, posB[2]]]} color={COLOR_REFERENCIA} lineWidth={0.8} dashed dashScale={0.2} dashSize={0.08} />
          <Line points={[posB, [posB[0], posB[1], 0]]} color={COLOR_REFERENCIA} lineWidth={0.8} dashed dashScale={0.2} dashSize={0.08} />
        </>
      )}

      {/* Hr */}
      {recta.trazaH && (
        <group>
          <mesh position={[recta.trazaH.x, 0, -recta.trazaH.z]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshBasicMaterial color={COLOR_TRAZA_H} />
          </mesh>
          <Text position={[recta.trazaH.x + 0.2, 0.25, -recta.trazaH.z]} fontSize={0.28} color={COLOR_TRAZA_H}>H{recta.nombre}</Text>
        </group>
      )}

      {/* Vr */}
      {recta.trazaV && (
        <group>
          <mesh position={[recta.trazaV.x, recta.trazaV.y, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshBasicMaterial color={COLOR_TRAZA_V} />
          </mesh>
          <Text position={[recta.trazaV.x + 0.2, recta.trazaV.y + 0.2, 0.1]} fontSize={0.28} color={COLOR_TRAZA_V}>V{recta.nombre}</Text>
        </group>
      )}
    </group>
  )
}
function InterseccionEntity({ interseccion }) {
  const { subTipo, puntoC, puntoD, punto, color = '#ffffff' } = interseccion

  if (subTipo === 'recta') {
    if (!puntoC && !puntoD) return null

    // Usamos los dos puntos para definir la recta: C en PV y D en PH
    // En Three.js: [x, y(cota), -z(alej)] con espejo X → [-x, y, -z]
    const toThree = p => [-p.x, p.y, -p.z]

    const pc = puntoC ? toThree(puntoC) : null
    const pd = puntoD ? toThree(puntoD) : null

    let inicio, fin
    const EXT = 8

    if (pc && pd) {
      const dx=pc[0]-pd[0], dy=pc[1]-pd[1], dz=pc[2]-pd[2]
      const len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1
      inicio = [pd[0]-dx/len*EXT, pd[1]-dy/len*EXT, pd[2]-dz/len*EXT]
      fin    = [pc[0]+dx/len*EXT, pc[1]+dy/len*EXT, pc[2]+dz/len*EXT]
    } else if (pc) {
      inicio = [pc[0]-EXT, pc[1], pc[2]]
      fin    = [pc[0]+EXT, pc[1], pc[2]]
    } else {
      inicio = [pd[0]-EXT, pd[1], pd[2]]
      fin    = [pd[0]+EXT, pd[1], pd[2]]
    }

    return (
      <group>
        {/* Recta de intersección principal */}
        <Line points={[inicio, fin]} color={color} lineWidth={3} />

        {/* Vi — traza en PV (alej=0, Three.z=0) */}
        {pc && (
          <group>
            <mesh position={pc}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
            <Text position={[pc[0]+0.25, pc[1]+0.25, pc[2]+0.1]} fontSize={0.3} color="#ffff00">Vi</Text>
          </group>
        )}

        {/* Hi — traza en PH (cota=0, Three.y=0) */}
        {pd && (
          <group>
            <mesh position={pd}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshBasicMaterial color="#ff8800" />
            </mesh>
            <Text position={[pd[0]+0.25, pd[1]+0.25, pd[2]+0.1]} fontSize={0.3} color="#ff8800">Hi</Text>
          </group>
        )}

        {/* Línea de referencia entre Vi y Hi */}
        {pc && pd && (
          <Line points={[pc, pd]} color={color} lineWidth={1}
            dashed dashScale={0.3} dashSize={0.1} transparent opacity={0.5} />
        )}
      </group>
    )
  }

  if (subTipo === 'punto' && punto) {
    const pos = [-punto.x, punto.y, -punto.z]
    return (
      <group>
        <mesh position={pos}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <Text position={[pos[0]+0.25, pos[1]+0.25, pos[2]+0.1]} fontSize={0.3} color={color}>i</Text>
        {/* Proyección en PH */}
        <mesh position={[pos[0], 0, pos[2]]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
        {/* Proyección en PV */}
        <mesh position={[pos[0], pos[1], 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
        {/* Líneas de referencia */}
        <Line points={[pos, [pos[0], 0, pos[2]]]} color={color} lineWidth={0.8}
          dashed dashScale={0.2} dashSize={0.08} transparent opacity={0.5} />
        <Line points={[pos, [pos[0], pos[1], 0]]} color={color} lineWidth={0.8}
          dashed dashScale={0.2} dashSize={0.08} transparent opacity={0.5} />
      </group>
    )
  }

  return null
}
function EscenaInterior() {
  const { puntos, rectas, planos, intersecciones, mostrarPH, mostrarPV, mostrarReferencias } = useDiedroStore()
  return (
    
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <PlanoHorizontal visible={mostrarPH} />
      <PlanoVertical visible={mostrarPV} />
      <LineaTierra />
      <EjesReferencia visible={mostrarReferencias} />
      <EtiquetasDiedros />
      {puntos.map(punto => (
        <PuntoConProyecciones key={punto.id} punto={punto} mostrarReferencias={mostrarReferencias} />
      ))}
      {rectas.map(recta => (
        <RectaConTrazas key={recta.id} recta={recta} puntos={puntos} mostrarReferencias={mostrarReferencias} />
      ))}
      {planos.map(plano => (
        <PlaneEntity key={plano.id} plano={plano} />
      ))}
      {intersecciones.map(i => (
  <InterseccionEntity key={i.id} interseccion={i} />
))}
      {intersecciones.map(i => (
  <InterseccionEntity key={i.id} interseccion={i} />
))}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={40} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ff4444', '#44ff44', '#4488ff']} labelColor="white" />
      </GizmoHelper>
    </>
  )
}

export default function DiedroScene() {
  return (
    <div className="w-full h-full bg-[#0a0a0a]">
      <Canvas
        camera={{ position: [8, 8, 8], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
        style={{ background: '#0a0a0a' }}
      >
        <EscenaInterior />
      </Canvas>
      <div className="absolute bottom-4 left-4 text-xs font-mono space-y-1 pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#00ffcc] inline-block" /><span className="text-[#00ffcc88]">1er Diedro</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-[#ff6666] inline-block" /><span className="text-[#ff666688]">Otros diedros</span></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ffff00] inline-block" /><span className="text-[#ffff0088]">Traza H</span></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#ff8800] inline-block" /><span className="text-[#ff880088]">Traza V</span></div>
      </div>
    </div>
  )
}