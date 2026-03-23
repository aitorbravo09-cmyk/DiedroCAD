import { useRef, useCallback } from 'react'
import useDiedroStore from '../store/useDiedroStore'

const ANCHO = 500
const ALTO  = 400
const CX    = 200
const CY    = 200
const SCALE = 20

const mToSvgX  = x  => CX + x * SCALE
const mToSvgYV = y  => CY - y * SCALE
const mToSvgYH = z  => CY + z * SCALE
const svgToMX  = sx => (sx - CX) / SCALE
const svgToMYV = sy => (CY - sy) / SCALE
const svgToMYH = sy => (sy - CY) / SCALE

const CPH = '#00ccaa'
const CPV = '#0088ff'
const CTH = '#ffff00'
const CTV = '#ff8800'

function calcVertice(trazaH) {
  if (!trazaH) return 0
  const dy = trazaH.y2 - trazaH.y1
  const dx = trazaH.x2 - trazaH.x1
  if (Math.abs(dy) < 1e-10) return trazaH.x1
  return trazaH.x1 - trazaH.y1 * dx / dy
}

function extLinea(x1, y1, x2, y2, px) {
  const dx = x2-x1, dy = y2-y1
  const len = Math.sqrt(dx*dx+dy*dy) || 1
  return { x1: x1-dx/len*px, y1: y1-dy/len*px, x2: x2+dx/len*px, y2: y2+dy/len*px }
}

function Handle({ cx, cy, r=6, fill, cursor='grab', onDown, label, labelDx=8, labelDy=0 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#000" strokeWidth={1.5}
        style={{ cursor }} onPointerDown={onDown} />
      {label && <text x={cx+labelDx} y={cy+labelDy+4} fontSize={10} fill={fill} fontFamily="monospace">{label}</text>}
    </g>
  )
}

function PlanoInteractivo({ plano, svgRef }) {
  const updatePlano = useDiedroStore(s => s.updatePlano)
  const dragState = useRef(null)
  const { trazaH, trazaV, color, nombre, id, tipo } = plano

  const vx_math = calcVertice(trazaH)
  const vx = mToSvgX(vx_math)

  const handleDown = useCallback((e, tipoDrag) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = { tipo: tipoDrag }
  }, [])

  const handleMove = useCallback((e) => {
    if (!dragState.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const { tipo: dt } = dragState.current

    if (dt === 'vertice') {
      const newVx = svgToMX(sx)
      const delta = newVx - vx_math
      updatePlano(id, {
        trazaH: trazaH ? { ...trazaH, x1: newVx, x2: trazaH.x2 + delta } : null,
        trazaV: trazaV ? { ...trazaV, x1: newVx, x2: trazaV.x2 + delta } : null,
      })
    }

    if (dt === 'extremoV') {
      const newX2 = svgToMX(sx)
      const newZ2 = svgToMYV(sy)
      if (newZ2 <= 0.1) return
      updatePlano(id, {
        trazaV: { x1: vx_math, z1: 0, x2: newX2, z2: newZ2 },
      })
    }

    if (dt === 'extremoH') {
      const newX2 = svgToMX(sx)
      const newY2 = svgToMYH(sy)
      if (newY2 <= 0.1) return
      updatePlano(id, {
        trazaH: { x1: vx_math, y1: 0, x2: newX2, y2: newY2 },
      })
    }

    if (dt === 'moverH') {
      const newCota = svgToMYV(sy)
      if (newCota <= 0.1) return
      updatePlano(id, { trazaV: { ...trazaV, z1: newCota, z2: newCota } })
    }

    if (dt === 'moverV') {
      const newAlej = svgToMYH(sy)
      if (newAlej <= 0.1) return
      updatePlano(id, { trazaH: { ...trazaH, y1: newAlej, y2: newAlej } })
    }

    if (dt === 'perfilX') {
      const newX = svgToMX(sx)
      updatePlano(id, {
        trazaH: { ...trazaH, x1: newX, x2: newX },
        trazaV: trazaV ? { ...trazaV, x1: newX, x2: newX } : null,
      })
    }

    if (dt === 'moverLT_V') {
      const newCota = svgToMYV(sy)
      if (newCota <= 0.1) return
      updatePlano(id, { trazaV: { ...trazaV, z1: newCota, z2: newCota } })
    }

    if (dt === 'moverLT_H') {
      const newAlej = svgToMYH(sy)
      if (newAlej <= 0.1) return
      updatePlano(id, { trazaH: { ...trazaH, y1: newAlej, y2: newAlej } })
    }
  }, [plano, vx_math, updatePlano, svgRef])

  const handleUp = useCallback(() => { dragState.current = null }, [])

  const renderContenido = () => {
    switch (tipo) {

      case 'oblicuo': {
        const v2x = mToSvgX(trazaV.x2), v2y = mToSvgYV(trazaV.z2)
        const h2x = mToSvgX(trazaH.x2), h2y = mToSvgYH(trazaH.y2)
        const lV = extLinea(vx, CY, v2x, v2y, 80)
        const lH = extLinea(vx, CY, h2x, h2y, 80)
        return (
          <>
            <line x1={lV.x1} y1={lV.y1} x2={lV.x2} y2={lV.y2} stroke={color} strokeWidth={2} />
            <text x={lV.x2+4} y={lV.y2} fontSize={11} fill={color} fontFamily="monospace">{nombre}₂</text>
            <line x1={lH.x1} y1={lH.y1} x2={lH.x2} y2={lH.y2} stroke={color} strokeWidth={2} />
            <text x={lH.x2+4} y={lH.y2} fontSize={11} fill={color} fontFamily="monospace">{nombre}₁</text>
            <Handle cx={vx} cy={CY} r={8} fill={color} cursor="ew-resize"
              onDown={e => handleDown(e, 'vertice')} label="V" labelDx={10} labelDy={-10} />
            <Handle cx={v2x} cy={v2y} fill={CTV} onDown={e => handleDown(e, 'extremoV')} label="α₂" />
            <Handle cx={h2x} cy={h2y} fill={CTH} onDown={e => handleDown(e, 'extremoH')} label="α₁" />
          </>
        )
      }

      case 'proyectanteH': {
        // α2 PERPENDICULAR (fija), α1 oblicua (se puede rotar)
        const v2x = mToSvgX(trazaV.x2), v2y = mToSvgYV(trazaV.z2)
        const h2x = mToSvgX(trazaH.x2), h2y = mToSvgYH(trazaH.y2)
        const lV = extLinea(vx, CY, v2x, v2y, 80)
        const lH = extLinea(vx, CY, h2x, h2y, 80)
        return (
          <>
            <line x1={lV.x1} y1={lV.y1} x2={lV.x2} y2={lV.y2} stroke={color} strokeWidth={2} />
            <text x={lV.x2+4} y={lV.y2} fontSize={11} fill={color} fontFamily="monospace">{nombre}₂</text>
            <line x1={lH.x1} y1={lH.y1} x2={lH.x2} y2={lH.y2} stroke={color} strokeWidth={2} />
            <text x={lH.x2+4} y={lH.y2} fontSize={11} fill={color} fontFamily="monospace">{nombre}₁</text>
            <Handle cx={vx} cy={CY} r={8} fill={color} cursor="ew-resize"
              onDown={e => handleDown(e, 'vertice')} label="V" labelDx={10} labelDy={-10} />
            {/* Solo α1 es rotable, α2 es perpendicular fija */}
            <Handle cx={h2x} cy={h2y} fill={CTH} onDown={e => handleDown(e, 'extremoH')} label="α₁" />
          </>
        )
      }

      case 'proyectanteV': {
        // α1 PERPENDICULAR (fija), α2 oblicua (se puede rotar)
        const v2x = mToSvgX(trazaV.x2), v2y = mToSvgYV(trazaV.z2)
        const h2x = mToSvgX(trazaH.x2), h2y = mToSvgYH(trazaH.y2)
        const lV = extLinea(vx, CY, v2x, v2y, 80)
        const lH = extLinea(vx, CY, h2x, h2y, 80)
        return (
          <>
            <line x1={lV.x1} y1={lV.y1} x2={lV.x2} y2={lV.y2} stroke={color} strokeWidth={2} />
            <text x={lV.x2+4} y={lV.y2} fontSize={11} fill={color} fontFamily="monospace">{nombre}₂</text>
            <line x1={lH.x1} y1={lH.y1} x2={lH.x2} y2={lH.y2} stroke={color} strokeWidth={2} />
            <text x={lH.x2+4} y={lH.y2} fontSize={11} fill={color} fontFamily="monospace">{nombre}₁</text>
            <Handle cx={vx} cy={CY} r={8} fill={color} cursor="ew-resize"
              onDown={e => handleDown(e, 'vertice')} label="V" labelDx={10} labelDy={-10} />
            {/* Solo α2 es rotable, α1 es perpendicular fija */}
            <Handle cx={v2x} cy={v2y} fill={CTV} onDown={e => handleDown(e, 'extremoV')} label="α₂" />
          </>
        )
      }

      case 'perfil': {
        const vxC = mToSvgX(trazaH.x1)
        return (
          <>
            <line x1={vxC} y1={CY-200} x2={vxC} y2={CY+200} stroke={color} strokeWidth={2} />
            <text x={vxC+6} y={CY-80} fontSize={11} fill={color} fontFamily="monospace">{nombre}₂</text>
            <text x={vxC+6} y={CY+80} fontSize={11} fill={color} fontFamily="monospace">{nombre}₁</text>
            <Handle cx={vxC} cy={CY} r={8} fill={color} cursor="ew-resize"
              onDown={e => handleDown(e, 'perfilX')} label="V" labelDx={10} labelDy={-10} />
          </>
        )
      }

      case 'paralelosPH': {
        if (!trazaV) return null
        const y = mToSvgYV(trazaV.z1)
        return (
          <>
            <line x1={20} y1={y} x2={ANCHO-20} y2={y} stroke={color} strokeWidth={2} />
            <text x={ANCHO-18} y={y-5} fontSize={11} fill={color} fontFamily="monospace">{nombre}₂</text>
            <Handle cx={ANCHO/2} cy={y} fill={color} cursor="ns-resize"
              onDown={e => handleDown(e, 'moverH')} label="↕" />
          </>
        )
      }

      case 'paralelosPV': {
        if (!trazaH) return null
        const y = mToSvgYH(trazaH.y1)
        return (
          <>
            <line x1={20} y1={y} x2={ANCHO-20} y2={y} stroke={color} strokeWidth={2} />
            <text x={ANCHO-18} y={y+13} fontSize={11} fill={color} fontFamily="monospace">{nombre}₁</text>
            <Handle cx={ANCHO/2} cy={y} fill={color} cursor="ns-resize"
              onDown={e => handleDown(e, 'moverV')} label="↕" />
          </>
        )
      }

      case 'paraleloLT': {
        const yV = trazaV ? mToSvgYV(trazaV.z1) : null
        const yH = trazaH ? mToSvgYH(trazaH.y1) : null
        return (
          <>
            {yV !== null && <>
              <line x1={20} y1={yV} x2={ANCHO-20} y2={yV} stroke={color} strokeWidth={2} />
              <text x={ANCHO-18} y={yV-5} fontSize={11} fill={color} fontFamily="monospace">{nombre}₂</text>
              <Handle cx={ANCHO/2} cy={yV} fill={CTV} cursor="ns-resize"
                onDown={e => handleDown(e, 'moverLT_V')} label="↕" />
            </>}
            {yH !== null && <>
              <line x1={20} y1={yH} x2={ANCHO-20} y2={yH} stroke={color} strokeWidth={2} />
              <text x={ANCHO-18} y={yH+13} fontSize={11} fill={color} fontFamily="monospace">{nombre}₁</text>
              <Handle cx={ANCHO/2+30} cy={yH} fill={CTH} cursor="ns-resize"
                onDown={e => handleDown(e, 'moverLT_H')} label="↕" />
            </>}
          </>
        )
      }

      case 'porLT':
        return (
          <>
            <circle cx={CX} cy={CY} r={6} fill={color} />
            <text x={CX+8} y={CY-6} fontSize={11} fill={color} fontFamily="monospace">{nombre}∈LT</text>
          </>
        )

      default:
        return null
    }
  }

  return (
    <g onPointerMove={handleMove} onPointerUp={handleUp}>
      {renderContenido()}
    </g>
  )
}

function PuntoMonge({ punto }) {
  const { x, y, z, nombre } = punto
  const pvx = mToSvgX(x), pvy = mToSvgYV(y)
  const phx = mToSvgX(x), phy = mToSvgYH(z)
  return (
    <g>
      <circle cx={pvx} cy={pvy} r={4} fill={CPV} />
      <text x={pvx+6} y={pvy-4} fontSize={11} fill={CPV} fontFamily="monospace">{nombre}′</text>
      <circle cx={phx} cy={phy} r={4} fill={CPH} />
      <text x={phx+6} y={phy+4} fontSize={11} fill={CPH} fontFamily="monospace">{nombre}″</text>
      <line x1={pvx} y1={pvy} x2={phx} y2={phy} stroke="#ffffff22" strokeWidth={1} strokeDasharray="3,3" />
      <circle cx={mToSvgX(x)} cy={CY} r={2} fill="#ffffff55" />
    </g>
  )
}

function RectaMonge({ recta, puntos }) {
  const pA = puntos.find(p => p.id === recta.puntoAId)
  const pB = puntos.find(p => p.id === recta.puntoBId)
  if (!pA || !pB) return null

  const EXT_T = 5
  const dy = pB.y-pA.y, dz = pB.z-pA.z, dx = pB.x-pA.x
  const t_H = Math.abs(dy) > 1e-10 ? -pA.y/dy : null
  const t_V = Math.abs(dz) > 1e-10 ? -pA.z/dz : null
  const cortes = [-EXT_T]
  if (t_H !== null) cortes.push(t_H)
  if (t_V !== null) cortes.push(t_V)
  cortes.push(1+EXT_T)
  cortes.sort((a,b) => a-b)

  const en1er = t => (pA.y+t*dy) >= 0 && (pA.z+t*dz) >= 0
  const pV = t => ({ x: mToSvgX(pA.x+t*dx), y: mToSvgYV(pA.y+t*dy) })
  const pH = t => ({ x: mToSvgX(pA.x+t*dx), y: mToSvgYH(pA.z+t*dz) })
  const segs = cortes.slice(0,-1).map((t1,i) => ({
    t1, t2: cortes[i+1], vis: en1er((t1+cortes[i+1])/2)
  }))
  const tMax = 1+EXT_T

  const vrX   = recta.trazaV ? mToSvgX(recta.trazaV.x) : null
  const vrPVy = recta.trazaV ? mToSvgYV(recta.trazaV.y) : null
  const hrX   = recta.trazaH ? mToSvgX(recta.trazaH.x) : null
  const hrPHy = recta.trazaH ? mToSvgYH(recta.trazaH.z) : null

  return (
    <g>
      {segs.map((s,i) => {
        const p1=pV(s.t1), p2=pV(s.t2)
        return <line key={`pv${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={CPV} strokeWidth={s.vis?2.5:1.5} strokeDasharray={s.vis?undefined:'5,3'} />
      })}
      <text x={pV(tMax).x+4} y={pV(tMax).y} fontSize={11} fill={CPV} fontFamily="monospace">{recta.nombre}′</text>
      {segs.map((s,i) => {
        const p1=pH(s.t1), p2=pH(s.t2)
        return <line key={`ph${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke={CPH} strokeWidth={s.vis?2.5:1.5} strokeDasharray={s.vis?undefined:'5,3'} />
      })}
      <text x={pH(tMax).x+4} y={pH(tMax).y} fontSize={11} fill={CPH} fontFamily="monospace">{recta.nombre}</text>
      {vrX && vrPVy && (
        <g>
          <circle cx={vrX} cy={vrPVy} r={5} fill={CTV} />
          <circle cx={vrX} cy={CY} r={4} fill={CTV} />
          <line x1={vrX} y1={vrPVy} x2={vrX} y2={CY} stroke={CTV} strokeWidth={1} strokeDasharray="3,2" />
          <text x={vrX+6} y={vrPVy-4} fontSize={11} fill={CTV} fontFamily="monospace">V{recta.nombre}</text>
        </g>
      )}
      {hrX && hrPHy && (
        <g>
          <circle cx={hrX} cy={hrPHy} r={5} fill={CTH} />
          <circle cx={hrX} cy={CY} r={4} fill={CTH} />
          <line x1={hrX} y1={CY} x2={hrX} y2={hrPHy} stroke={CTH} strokeWidth={1} strokeDasharray="3,2" />
          <text x={hrX+6} y={hrPHy+4} fontSize={11} fill={CTH} fontFamily="monospace">H{recta.nombre}</text>
        </g>
      )}
    </g>
  )
}
function InterseccionMonge({ interseccion }) {
  const { subTipo, puntoC, puntoD, punto, color = '#ffffff' } = interseccion

  const extLinea2D = (x1, y1, x2, y2, px) => {
    const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)||1
    return { x1: x1-dx/len*px, y1: y1-dy/len*px, x2: x2+dx/len*px, y2: y2+dy/len*px }
  }

  if (subTipo === 'recta') {
    if (!puntoC && !puntoD) return null

    // i′ en PV (arriba LT):
    // - Pasa por Vi = (xC, cotaC) en PV
    // - Pasa por Hi proyectado = (xD, 0) en LT
    // i″ en PH (abajo LT):
    // - Pasa por Hi = (xD, alejD) en PH
    // - Pasa por Vi proyectado = (xC, 0) en LT

    // Puntos SVG de Vi
    const viSvgX = puntoC ? mToSvgX(puntoC.x) : null
    const viSvgY = puntoC ? mToSvgYV(puntoC.y) : null  // cota → arriba

    // Puntos SVG de Hi
    const hiSvgX = puntoD ? mToSvgX(puntoD.x) : null
    const hiSvgY = puntoD ? mToSvgYH(puntoD.z) : null  // alejamiento → abajo

    // i′: desde (xD en LT) → Vi(xC, cotaC)
    let lineaIp = null
    if (puntoC && puntoD) {
      const A = { x: mToSvgX(puntoD.x), y: CY }  // D proyectado en PV = sobre LT
      const B = { x: viSvgX, y: viSvgY }
      const l = extLinea2D(A.x, A.y, B.x, B.y, 80)
      lineaIp = l
    } else if (puntoC) {
      lineaIp = { x1: 0, y1: viSvgY, x2: ANCHO, y2: viSvgY }
    }

    // i″: desde (xC en LT) → Hi(xD, alejD)
    let lineaIpp = null
    if (puntoC && puntoD) {
      const A = { x: mToSvgX(puntoC.x), y: CY }  // C proyectado en PH = sobre LT
      const B = { x: hiSvgX, y: hiSvgY }
      const l = extLinea2D(A.x, A.y, B.x, B.y, 80)
      lineaIpp = l
    } else if (puntoD) {
      lineaIpp = { x1: 0, y1: hiSvgY, x2: ANCHO, y2: hiSvgY }
    }

    return (
      <g>
        {/* i′ — proyección en PV */}
        {lineaIp && (
          <>
            <line x1={lineaIp.x1} y1={lineaIp.y1} x2={lineaIp.x2} y2={lineaIp.y2}
              stroke={color} strokeWidth={2.5} />
            <text x={lineaIp.x2+4} y={lineaIp.y2} fontSize={11} fill={color} fontFamily="monospace">i′</text>
          </>
        )}

        {/* i″ — proyección en PH */}
        {lineaIpp && (
          <>
            <line x1={lineaIpp.x1} y1={lineaIpp.y1} x2={lineaIpp.x2} y2={lineaIpp.y2}
              stroke={color} strokeWidth={2.5} />
            <text x={lineaIpp.x2+4} y={lineaIpp.y2} fontSize={11} fill={color} fontFamily="monospace">i″</text>
          </>
        )}

        {/* Vi — traza en PV con perpendicular a LT */}
        {puntoC && viSvgX && viSvgY && (
          <g>
            <circle cx={viSvgX} cy={viSvgY} r={5} fill="#ffff00" />
            <circle cx={viSvgX} cy={CY} r={4} fill="#ffff00" />
            <line x1={viSvgX} y1={viSvgY} x2={viSvgX} y2={CY}
              stroke="#ffff00" strokeWidth={1.5} strokeDasharray="4,2" />
            <text x={viSvgX+6} y={viSvgY-5} fontSize={10} fill="#ffff00" fontFamily="monospace">Vi</text>
          </g>
        )}

        {/* Hi — traza en PH con perpendicular a LT */}
        {puntoD && hiSvgX && hiSvgY && (
          <g>
            <circle cx={hiSvgX} cy={hiSvgY} r={5} fill="#ff8800" />
            <circle cx={hiSvgX} cy={CY} r={4} fill="#ff8800" />
            <line x1={hiSvgX} y1={CY} x2={hiSvgX} y2={hiSvgY}
              stroke="#ff8800" strokeWidth={1.5} strokeDasharray="4,2" />
            <text x={hiSvgX+6} y={hiSvgY+12} fontSize={10} fill="#ff8800" fontFamily="monospace">Hi</text>
          </g>
        )}

        {/* Marcas de correspondencia en LT */}
        {puntoD && (
          <line x1={mToSvgX(puntoD.x)} y1={CY-5} x2={mToSvgX(puntoD.x)} y2={CY+5}
            stroke={color} strokeWidth={2} />
        )}
        {puntoC && (
          <line x1={mToSvgX(puntoC.x)} y1={CY-5} x2={mToSvgX(puntoC.x)} y2={CY+5}
            stroke={color} strokeWidth={2} />
        )}
      </g>
    )
  }

  if (subTipo === 'punto' && punto) {
    const pvx = mToSvgX(punto.x), pvy = mToSvgYV(punto.y)
    const phx = mToSvgX(punto.x), phy = mToSvgYH(punto.z)
    return (
      <g>
        {/* i′ en PV */}
        <circle cx={pvx} cy={pvy} r={6} fill={color} stroke="#000" strokeWidth={1} />
        <text x={pvx+8} y={pvy-4} fontSize={11} fill={color} fontFamily="monospace">i′</text>
        {/* i″ en PH */}
        <circle cx={phx} cy={phy} r={6} fill={color} stroke="#000" strokeWidth={1} />
        <text x={phx+8} y={phy+4} fontSize={11} fill={color} fontFamily="monospace">i″</text>
        {/* Línea de referencia */}
        <line x1={pvx} y1={pvy} x2={phx} y2={phy}
          stroke={`${color}55`} strokeWidth={1} strokeDasharray="3,3" />
        {/* Marca en LT */}
        <line x1={mToSvgX(punto.x)} y1={CY-5} x2={mToSvgX(punto.x)} y2={CY+5}
          stroke={color} strokeWidth={2} />
      </g>
    )
  }

  return null
}
export default function Vista2D() {
  const { puntos, planos, rectas, intersecciones } = useDiedroStore()
  const svgRef = useRef(null)

  return (
    <div className="w-full h-full bg-[#0d0d0d] border-l border-[#1a1a1a] flex flex-col">
      <div className="h-8 border-b border-[#1a1a1a] flex items-center px-3 gap-3">
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Vista Mongeana 2D</span>
        <span className="text-[10px] font-mono text-neutral-600">· arrastra ⬤ para editar</span>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <svg ref={svgRef} width={ANCHO} height={ALTO}
          style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', touchAction: 'none' }}>

          <rect x={0} y={0} width={ANCHO} height={CY} fill="#001a2a" opacity={0.5} />
          <rect x={0} y={CY} width={ANCHO} height={CY} fill="#001a1a" opacity={0.5} />

          {Array.from({length:25},(_,i)=>i-12).map(i=>(
            <line key={`gv${i}`} x1={CX+i*SCALE} y1={0} x2={CX+i*SCALE} y2={ALTO} stroke="#ffffff06" strokeWidth={1}/>
          ))}
          {Array.from({length:21},(_,i)=>i-10).map(i=>(
            <line key={`gh${i}`} x1={0} y1={CY+i*SCALE} x2={ANCHO} y2={CY+i*SCALE} stroke="#ffffff06" strokeWidth={1}/>
          ))}

          <line x1={0} y1={CY} x2={ANCHO} y2={CY} stroke="#ffffff" strokeWidth={2}/>
          <text x={ANCHO-22} y={CY-7} fontSize={12} fill="#ffffff" fontFamily="monospace" fontWeight="bold">LT</text>
          <text x={8} y={18} fontSize={10} fill="#0088ff88" fontFamily="monospace">PV — cota Y ↑</text>
          <text x={8} y={ALTO-6} fontSize={10} fill="#00ccaa88" fontFamily="monospace">PH — alejamiento Z ↓</text>

          {Array.from({length:25},(_,i)=>i-12).map(i=>(
            <g key={`m${i}`}>
              <line x1={CX+i*SCALE} y1={CY-3} x2={CX+i*SCALE} y2={CY+3} stroke="#ffffff33" strokeWidth={1}/>
              {i!==0&&<text x={CX+i*SCALE-3} y={CY+13} fontSize={8} fill="#ffffff22" fontFamily="monospace">{i}</text>}
            </g>
          ))}
          <circle cx={CX} cy={CY} r={3} fill="#ffffff55"/>
{intersecciones.map(i => (
  <InterseccionMonge key={i.id} interseccion={i} />
))}
          {planos.map(p => <PlanoInteractivo key={p.id} plano={p} svgRef={svgRef} />)}
          {rectas.map(r => <RectaMonge key={r.id} recta={r} puntos={puntos} />)}
          {puntos.map(p => <PuntoMonge key={p.id} punto={p} />)}
        </svg>
      </div>
    </div>
  )
}