import { create } from 'zustand'

// ─── Helpers básicos ──────────────────────────────────────────────────────────

function esVisible(punto) { return punto.y >= 0 && punto.z >= 0 }
function esVisibleSegmento(pA, pB) { return esVisible(pA) && esVisible(pB) }

function calcularTrazas(puntoA, puntoB) {
  const { x: x1, y: y1, z: z1 } = puntoA
  const { x: x2, y: y2, z: z2 } = puntoB
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1
  let trazaH = null, trazaV = null
  if (Math.abs(dy) > 1e-10) {
    const t = -y1 / dy
    trazaH = { x: x1 + t * dx, y: 0, z: z1 + t * dz, t, visible: t >= 0 && t <= 1 }
  }
  if (Math.abs(dz) > 1e-10) {
    const t = -z1 / dz
    trazaV = { x: x1 + t * dx, y: y1 + t * dy, z: 0, t, visible: t >= 0 && t <= 1 }
  }
  return { trazaH, trazaV }
}

// ─── Motor matemático de intersecciones ──────────────────────────────────────

function interp1D(x1, a1, x2, a2, x) {
  const d = x2 - x1
  if (Math.abs(d) < 1e-10) return a1
  return a1 + (a2 - a1) * (x - x1) / d
}

// Línea 2D: A·x + B·u = C
function lineEq2D(x1, u1, x2, u2) {
  const A = u2 - u1
  const B = -(x2 - x1)
  const C = A * x1 + B * u1
  return { A, B, C }
}

// Intersección de dos líneas 2D → {x, u} | null
function intersect2DLines(l1, l2) {
  const det = l1.A * l2.B - l2.A * l1.B
  if (Math.abs(det) < 1e-10) return null
  return {
    x: (l1.C * l2.B - l2.C * l1.B) / det,
    u: (l1.A * l2.C - l2.A * l1.C) / det
  }
}

function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
}

function normalize3(v) {
  const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
  if (len < 1e-10) return null
  return [v[0] / len, v[1] / len, v[2] / len]
}

// Obtiene normal del plano y un punto sobre él
// Sistema: X=lateral, Y=cota, Z=alejamiento
function getPlaneNormalAndPoint(plano) {
  const { trazaH, trazaV } = plano
  const hPt = x => trazaH
    ? [x, 0, interp1D(trazaH.x1, trazaH.y1, trazaH.x2, trazaH.y2, x)]
    : null
  const vPt = x => trazaV
    ? [x, interp1D(trazaV.x1, trazaV.z1, trazaV.x2, trazaV.z2, x), 0]
    : null

  let P1, P2, P3

  if (trazaH && trazaV) {
    P1 = hPt(-3); P2 = hPt(3); P3 = vPt(3)
  } else if (trazaH && !trazaV) {
    // Frontal: paralelo a PV → normal en Z
    P1 = hPt(-3); P2 = hPt(3)
    P3 = [P1[0], P1[1] + 5, P1[2]]
  } else if (!trazaH && trazaV) {
    // Horizontal: paralelo a PH → normal en Y
    P1 = vPt(-3); P2 = vPt(3)
    P3 = [P1[0], P1[1], P1[2] + 5]
  } else {
    return null
  }

  if (!P1 || !P2 || !P3) return null
  const v1 = [P2[0]-P1[0], P2[1]-P1[1], P2[2]-P1[2]]
  const v2 = [P3[0]-P1[0], P3[1]-P1[1], P3[2]-P1[2]]
  const normal = normalize3(cross3(v1, v2))
  if (!normal) return null
  return { normal, point: P1 }
}

// Intersección plano-plano → {puntoH, puntoV} | null
// puntoH: punto en PH (Y_cota=0) = traza H de la recta intersección
// puntoV: punto en PV (Z_alej=0) = traza V de la recta intersección
function planePlaneIntersection(planoA, planoB) {
  let H_i = null, V_i = null

  // 1. Intersección de trazas H en PH (coords: X, Z_alej=trazaH.y)
  if (planoA.trazaH && planoB.trazaH) {
    const lA = lineEq2D(planoA.trazaH.x1, planoA.trazaH.y1, planoA.trazaH.x2, planoA.trazaH.y2)
    const lB = lineEq2D(planoB.trazaH.x1, planoB.trazaH.y1, planoB.trazaH.x2, planoB.trazaH.y2)
    const pt = intersect2DLines(lA, lB)
    if (pt) H_i = { x: pt.x, y: 0, z: pt.u }
  }

  // 2. Intersección de trazas V en PV (coords: X, Y_cota=trazaV.z)
  if (planoA.trazaV && planoB.trazaV) {
    const lA = lineEq2D(planoA.trazaV.x1, planoA.trazaV.z1, planoA.trazaV.x2, planoA.trazaV.z2)
    const lB = lineEq2D(planoB.trazaV.x1, planoB.trazaV.z1, planoB.trazaV.x2, planoB.trazaV.z2)
    const pt = intersect2DLines(lA, lB)
    if (pt) V_i = { x: pt.x, y: pt.u, z: 0 }
  }

  // 3. Si falta uno, calcularlo por dirección de intersección (nA × nB)
  if ((H_i && !V_i) || (!H_i && V_i)) {
    const npA = getPlaneNormalAndPoint(planoA)
    const npB = getPlaneNormalAndPoint(planoB)
    if (npA && npB) {
      const dir = cross3(npA.normal, npB.normal)
      if (H_i && !V_i && Math.abs(dir[2]) > 1e-10) {
        const t = -H_i.z / dir[2]
        V_i = { x: H_i.x + t*dir[0], y: H_i.y + t*dir[1], z: 0 }
      }
      if (!H_i && V_i && Math.abs(dir[1]) > 1e-10) {
        const t = -V_i.y / dir[1]
        H_i = { x: V_i.x + t*dir[0], y: 0, z: V_i.z + t*dir[2] }
      }
    }
  }

  if (H_i && V_i) return { puntoH: H_i, puntoV: V_i }
  return null
}

// Intersección recta-plano → punto | null
function linePlaneIntersection(recta, plano, allPuntos) {
  const pA = allPuntos.find(p => p.id === recta.puntoAId)
  const pB = allPuntos.find(p => p.id === recta.puntoBId)
  if (!pA || !pB) return null

  const np = getPlaneNormalAndPoint(plano)
  if (!np) return null

  const [Nx, Ny, Nz] = np.normal
  const [Px, Py, Pz] = np.point
  const dx = pB.x-pA.x, dy = pB.y-pA.y, dz = pB.z-pA.z

  const denom = Nx*dx + Ny*dy + Nz*dz
  if (Math.abs(denom) < 1e-10) return null

  const t = (Nx*(Px-pA.x) + Ny*(Py-pA.y) + Nz*(Pz-pA.z)) / denom
  return { x: pA.x+t*dx, y: pA.y+t*dy, z: pA.z+t*dz }
}

export function calcularInterseccionPlanos(planoA, planoB) {
  return planePlaneIntersection(planoA, planoB)
}

// ─── Tipos de plano ───────────────────────────────────────────────────────────

export const TIPOS_PLANO = {
  oblicuo: {
    nombre: 'Oblicuo',
    descripcion: 'α1 y α2 oblicuas. Se cortan en V sobre LT.',
    trazaH: { x1: -6, y1: -3, x2: 6, y2: 3 },
    trazaV: { x1: -6, z1: -4, x2: 6, z2: 4 },
  },
  proyectanteH: {
    nombre: 'Proyectante Horizontal',
    descripcion: 'α2 perpendicular a LT. α1 oblicua. Se cortan en V.',
    trazaH: { x1: -4, y1: -3, x2: 2, y2: 0 },
    trazaV: { x1: 2, z1: -5, x2: 2, z2: 5 },
  },
  proyectanteV: {
    nombre: 'Proyectante Vertical (De Canto)',
    descripcion: 'α1 perpendicular a LT. α2 oblicua. Se cortan en V.',
    trazaH: { x1: 2, y1: -5, x2: 2, y2: 5 },
    trazaV: { x1: 2, z1: 0, x2: 6, z2: 4 },
  },
  perfil: {
    nombre: 'De Perfil',
    descripcion: 'α1 y α2 perpendiculares a LT en el mismo punto V.',
    trazaH: { x1: 2, y1: -5, x2: 2, y2: 5 },
    trazaV: { x1: 2, z1: -5, x2: 2, z2: 5 },
  },
  paralelosPH: {
    nombre: 'Paralelo al PH',
    descripcion: 'Solo α2 paralela a LT a altura z. Sin α1.',
    trazaH: null,
    trazaV: { x1: -6, z1: 3, x2: 6, z2: 3 },
  },
  paralelosPV: {
    nombre: 'Paralelo al PV (Frontal)',
    descripcion: 'Solo α1 paralela a LT a distancia y. Sin α2.',
    trazaH: { x1: -6, y1: 3, x2: 6, y2: 3 },
    trazaV: null,
  },
  paraleloLT: {
    nombre: 'Paralelo a la LT',
    descripcion: 'α1 y α2 ambas paralelas a LT, separadas.',
    trazaH: { x1: -6, y1: 2, x2: 6, y2: 2 },
    trazaV: { x1: -6, z1: 3, x2: 6, z2: 3 },
  },
  porLT: {
    nombre: 'Pasa por la LT',
    descripcion: 'Sin trazas visibles. Definido por punto en perfil.',
    trazaH: null,
    trazaV: null,
  },
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useDiedroStore = create((set, get) => ({
  puntos: [],
  rectas: [],
  planos: [],
  intersecciones: [],
  seleccionado: null,
  modoHerramienta: 'punto',
  mostrarPH: true,
  mostrarPV: true,
  mostrarReferencias: true,
  mostrarIntersecciones: true,

  // ── Puntos ──────────────────────────────────────────────────────────────────
  addPunto: (x, y, z, nombre) => {
    const id = `P${Date.now()}`
    const punto = {
      id, nombre: nombre || id,
      x: parseFloat(x), y: parseFloat(y), z: parseFloat(z),
      visible: esVisible({ x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) })
    }
    set(state => ({ puntos: [...state.puntos, punto] }))
    return id
  },

  updatePunto: (id, x, y, z) => {
    set(state => ({
      puntos: state.puntos.map(p =>
        p.id === id ? { ...p, x: parseFloat(x), y: parseFloat(y), z: parseFloat(z), visible: esVisible({ x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) }) } : p
      ),
      rectas: state.rectas.map(r => {
        if (r.puntoAId === id || r.puntoBId === id) {
          const puntos = get().puntos
          const pA = r.puntoAId === id ? { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) } : puntos.find(p => p.id === r.puntoAId)
          const pB = r.puntoBId === id ? { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) } : puntos.find(p => p.id === r.puntoBId)
          if (pA && pB) return { ...r, ...calcularTrazas(pA, pB) }
        }
        return r
      }),
    }))
  },

  removePunto: (id) => set(state => ({
    puntos: state.puntos.filter(p => p.id !== id),
    rectas: state.rectas.filter(r => r.puntoAId !== id && r.puntoBId !== id)
  })),

  // ── Rectas ──────────────────────────────────────────────────────────────────
  addRecta: (puntoAId, puntoBId, nombre) => {
    const { puntos } = get()
    const pA = puntos.find(p => p.id === puntoAId)
    const pB = puntos.find(p => p.id === puntoBId)
    if (!pA || !pB) return null
    const { trazaH, trazaV } = calcularTrazas(pA, pB)
    const id = `R${Date.now()}`
    set(state => ({
      rectas: [...state.rectas, {
        id, nombre: nombre || id,
        puntoAId, puntoBId,
        trazaH, trazaV,
        visible: esVisibleSegmento(pA, pB)
      }]
    }))
    return id
  },

  removeRecta: (id) => set(state => ({ rectas: state.rectas.filter(r => r.id !== id) })),

  // ── Planos ──────────────────────────────────────────────────────────────────
  addPlano: (tipo, nombre, trazaHCustom, trazaVCustom) => {
    const config = TIPOS_PLANO[tipo]
    if (!config) return null
    const id = `Pl${Date.now()}`
    const trazaH = trazaHCustom !== undefined ? trazaHCustom : config.trazaH
    const trazaV = trazaVCustom !== undefined ? trazaVCustom : config.trazaV
    const colores = ['#ffaa00', '#ff4444', '#44ffaa', '#ff44ff', '#44aaff', '#ffff44', '#ff8800', '#00ffcc']
    const color = colores[get().planos.length % colores.length]
    const plano = {
      id,
      nombre: nombre || `${config.nombre} ${get().planos.length + 1}`,
      tipo, trazaH, trazaV, color
    }
    set(state => ({ planos: [...state.planos, plano] }))
    return id
  },

  updatePlano: (id, updates) => {
    set(state => ({
      planos: state.planos.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  },

  updatePlanoTrazas: (id, trazaH, trazaV) => {
    set(state => ({ planos: state.planos.map(p => p.id === id ? { ...p, trazaH, trazaV } : p) }))
  },

  removePlano: (id) => set(state => ({ planos: state.planos.filter(p => p.id !== id) })),

  // ── Intersecciones ──────────────────────────────────────────────────────────
  calcularInterseccion: (id1, id2) => {
    const { puntos, rectas, planos, intersecciones } = get()

    const esPlano1 = planos.some(p => p.id === id1)
    const esPlano2 = planos.some(p => p.id === id2)
    const esRecta1 = rectas.some(r => r.id === id1)
    const esRecta2 = rectas.some(r => r.id === id2)

    const obj1 = esPlano1 ? planos.find(p => p.id === id1) : rectas.find(r => r.id === id1)
    const obj2 = esPlano2 ? planos.find(p => p.id === id2) : rectas.find(r => r.id === id2)

    if (!obj1 || !obj2) return null

    const id = `INT${Date.now()}`
    const nombre = `i${intersecciones.length + 1}`
    let entidad = null

    if (esPlano1 && esPlano2) {
      // Plano ∩ Plano → Recta
      const res = planePlaneIntersection(obj1, obj2)
      if (res) {
        entidad = {
          id, nombre,
          tipo: 'interseccion',
          subTipo: 'plano-plano',
          resultado: 'recta',
          puntoH: res.puntoH,  // en PH (y_cota=0)
          puntoV: res.puntoV,  // en PV (z_alej=0)
          ids: [id1, id2],
          color: '#ffffff',
        }
      }
    } else if ((esRecta1 && esPlano2) || (esPlano1 && esRecta2)) {
      // Recta ∩ Plano → Punto
      const recta = esRecta1 ? obj1 : obj2
      const plano = esPlano1 ? obj1 : obj2
      const pt = linePlaneIntersection(recta, plano, puntos)
      if (pt) {
        entidad = {
          id, nombre,
          tipo: 'interseccion',
          subTipo: 'recta-plano',
          resultado: 'punto',
          punto: pt,
          ids: [id1, id2],
          color: '#ffffff',
        }
      }
    }

    if (entidad) {
      set(state => ({ intersecciones: [...state.intersecciones, entidad] }))
      return entidad
    }
    return null
  },

  removeInterseccion: (id) => set(state => ({
    intersecciones: state.intersecciones.filter(i => i.id !== id)
  })),

  clearIntersecciones: () => set({ intersecciones: [] }),
  toggleIntersecciones: () => set(state => ({ mostrarIntersecciones: !state.mostrarIntersecciones })),

  // ── UI ──────────────────────────────────────────────────────────────────────
  setSeleccionado: (id) => set({ seleccionado: id }),
  setModoHerramienta: (modo) => set({ modoHerramienta: modo }),
  togglePH: () => set(state => ({ mostrarPH: !state.mostrarPH })),
  togglePV: () => set(state => ({ mostrarPV: !state.mostrarPV })),
  toggleReferencias: () => set(state => ({ mostrarReferencias: !state.mostrarReferencias })),
  clearAll: () => set({ puntos: [], rectas: [], planos: [], intersecciones: [], seleccionado: null }),
  getPuntoById: (id) => get().puntos.find(p => p.id === id),
  getRectaById: (id) => get().rectas.find(r => r.id === id),
  getPlanoById: (id) => get().planos.find(p => p.id === id),
}))

export default useDiedroStore