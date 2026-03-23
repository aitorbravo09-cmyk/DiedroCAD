
import { useState } from 'react'
import useDiedroStore from './store/useDiedroStore'
import { TIPOS_PLANO } from './store/useDiedroStore'
import DiedroScene from './components/DiedroScene'
import Vista2D from './components/Vista2D'

const IconPoint = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="currentColor" /></svg>)
const IconLine = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="2" cy="14" r="2" fill="currentColor" /><circle cx="14" cy="2" r="2" fill="currentColor" /></svg>)
const IconLayers = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L15 5L8 9L1 5L8 1Z" stroke="currentColor" strokeWidth="1.5" /><path d="M1 9L8 13L15 9" stroke="currentColor" strokeWidth="1.5" /></svg>)
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>)
const IconEye = ({ open = true }) => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none">{open ? (<><ellipse cx="8" cy="8" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="2.5" fill="currentColor" /></>) : (<><path d="M2 2l12 12M5 4.5A7.5 5 0 001 8s2.5 5 7 5a7 7 0 003.5-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M11.5 5.5A7 7 0 0115 8s-2.5 5-7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>)}</svg>)

function FormularioPunto() {
  const [coords, setCoords] = useState({ x: '', y: '', z: '', nombre: '' })
  const [error, setError] = useState('')
  const addPunto = useDiedroStore(s => s.addPunto)

  const handleSubmit = () => {
    const x = parseFloat(coords.x), y = parseFloat(coords.y), z = parseFloat(coords.z)
    if (isNaN(x) || isNaN(y) || isNaN(z)) { setError('Introduce valores numéricos válidos.'); return }
    setError('')
    addPunto(x, y, z, coords.nombre || undefined)
    setCoords({ x: '', y: '', z: '', nombre: '' })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {['x', 'y', 'z'].map(axis => (
          <div key={axis}>
            <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mb-0.5 block">
              {axis === 'x' ? 'X lat.' : axis === 'y' ? 'Y cota' : 'Z alej.'}
            </label>
            <input type="number" step="0.1" placeholder="0" value={coords[axis]}
              onChange={e => setCoords(c => ({ ...c, [axis]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-[#111] border border-[#2a2a2a] text-[#00ffcc] text-sm font-mono px-2 py-1.5 rounded focus:outline-none focus:border-[#00ffcc44]" />
          </div>
        ))}
      </div>
      <input type="text" placeholder="Nombre (A, B, P1...)" value={coords.nombre}
        onChange={e => setCoords(c => ({ ...c, nombre: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-full bg-[#111] border border-[#2a2a2a] text-neutral-300 text-sm font-mono px-2 py-1.5 rounded focus:outline-none focus:border-[#00ffcc44]" />
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <button onClick={handleSubmit} className="w-full bg-[#00ffcc11] hover:bg-[#00ffcc22] border border-[#00ffcc33] hover:border-[#00ffcc66] text-[#00ffcc] text-sm font-mono py-2 rounded transition-all">+ Añadir Punto</button>
    </div>
  )
}

function FormularioRecta() {
  const [sel, setSel] = useState({ a: '', b: '', nombre: '' })
  const [error, setError] = useState('')
  const { puntos, addRecta } = useDiedroStore()

  if (puntos.length < 2) return <p className="text-neutral-600 text-xs font-mono">Necesitas al menos 2 puntos.</p>

  const handleSubmit = () => {
    if (!sel.a || !sel.b || sel.a === sel.b) { setError('Selecciona dos puntos distintos.'); return }
    setError('')
    addRecta(sel.a, sel.b, sel.nombre || undefined)
    setSel({ a: '', b: '', nombre: '' })
  }

  return (
    <div className="space-y-2">
      {['a', 'b'].map(key => (
        <div key={key}>
          <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mb-0.5 block">Punto {key.toUpperCase()}</label>
          <select value={sel[key]} onChange={e => setSel(s => ({ ...s, [key]: e.target.value }))}
            className="w-full bg-[#111] border border-[#2a2a2a] text-neutral-300 text-sm font-mono px-2 py-1.5 rounded focus:outline-none appearance-none">
            <option value="">— seleccionar —</option>
            {puntos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.x}, {p.y}, {p.z})</option>)}
          </select>
        </div>
      ))}
      <input type="text" placeholder="Nombre (r, s...)" value={sel.nombre}
        onChange={e => setSel(s => ({ ...s, nombre: e.target.value }))}
        className="w-full bg-[#111] border border-[#2a2a2a] text-neutral-300 text-sm font-mono px-2 py-1.5 rounded focus:outline-none" />
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <button onClick={handleSubmit} className="w-full bg-[#0088ff11] hover:bg-[#0088ff22] border border-[#0088ff33] hover:border-[#0088ff66] text-[#0088ff] text-sm font-mono py-2 rounded transition-all">+ Añadir Recta</button>
    </div>
  )
}

function FormularioPlano() {
  const [tipo, setTipo] = useState('oblicuo')
  const [nombre, setNombre] = useState('')
  const addPlano = useDiedroStore(s => s.addPlano)

  const handleSubmit = () => {
    addPlano(tipo, nombre || undefined)
    setNombre('')
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mb-0.5 block">Tipo de Plano</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="w-full bg-[#111] border border-[#2a2a2a] text-neutral-300 text-sm font-mono px-2 py-1.5 rounded focus:outline-none appearance-none">
          {Object.entries(TIPOS_PLANO).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.nombre}</option>
          ))}
        </select>
      </div>
      <p className="text-[10px] text-neutral-600 font-mono">{TIPOS_PLANO[tipo]?.descripcion}</p>
      <input type="text" placeholder="Nombre (α, β, π1...)" value={nombre}
        onChange={e => setNombre(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-full bg-[#111] border border-[#2a2a2a] text-neutral-300 text-sm font-mono px-2 py-1.5 rounded focus:outline-none" />
      <button onClick={handleSubmit} className="w-full bg-[#ffaa0011] hover:bg-[#ffaa0022] border border-[#ffaa0033] hover:border-[#ffaa0066] text-[#ffaa00] text-sm font-mono py-2 rounded transition-all">+ Añadir Plano</button>
    </div>
  )
}

function ListaEntidades() {
  const { puntos, rectas, planos, removePunto, removeRecta, removePlano, seleccionado, setSeleccionado } = useDiedroStore()
  if (puntos.length === 0 && rectas.length === 0 && planos.length === 0) return <p className="text-neutral-700 text-xs font-mono italic text-center py-4">Sin entidades</p>
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {puntos.map(p => (
        <div key={p.id} onClick={() => setSeleccionado(p.id)}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${seleccionado === p.id ? 'bg-[#00ffcc15] border border-[#00ffcc33]' : 'hover:bg-[#ffffff08] border border-transparent'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${p.visible ? 'bg-[#00ffcc]' : 'bg-[#ff6666]'}`} />
            <span className="text-xs font-mono text-neutral-300">{p.nombre}</span>
            <span className="text-[10px] font-mono text-neutral-600">({p.x}, {p.y}, {p.z})</span>
          </div>
          <button onClick={e => { e.stopPropagation(); removePunto(p.id) }} className="text-neutral-700 hover:text-red-400"><IconTrash /></button>
        </div>
      ))}
      {rectas.map(r => (
        <div key={r.id} onClick={() => setSeleccionado(r.id)}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${seleccionado === r.id ? 'bg-[#0088ff15] border border-[#0088ff33]' : 'hover:bg-[#ffffff08] border border-transparent'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-0.5 ${r.visible ? 'bg-[#0088ff]' : 'bg-[#ff6666]'}`} />
            <span className="text-xs font-mono text-neutral-300">{r.nombre}</span>
          </div>
          <button onClick={e => { e.stopPropagation(); removeRecta(r.id) }} className="text-neutral-700 hover:text-red-400"><IconTrash /></button>
        </div>
      ))}
      {planos.map(pl => (
        <div key={pl.id} onClick={() => setSeleccionado(pl.id)}
          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${seleccionado === pl.id ? 'border border-[#ffaa0033]' : 'hover:bg-[#ffffff08] border border-transparent'}`}>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm opacity-60" style={{ background: pl.color }} />
            <span className="text-xs font-mono text-neutral-300">{pl.nombre}</span>
            <span className="text-[10px] font-mono text-neutral-600">{TIPOS_PLANO[pl.tipo]?.nombre}</span>
          </div>
          <button onClick={e => { e.stopPropagation(); removePlano(pl.id) }} className="text-neutral-700 hover:text-red-400"><IconTrash /></button>
        </div>
      ))}
    </div>
  )
}

function Seccion({ titulo, icono, defaultOpen = true, children }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  return (
    <div className="border-b border-[#1a1a1a]">
      <button onClick={() => setAbierto(a => !a)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#ffffff05]">
        <div className="flex items-center gap-2 text-neutral-400">{icono}<span className="text-xs font-mono uppercase tracking-widest">{titulo}</span></div>
        <span className={`text-neutral-600 text-xs transition-transform ${abierto ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {abierto && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function PanelCapas() {
  const { mostrarPH, mostrarPV, mostrarReferencias, togglePH, togglePV, toggleReferencias } = useDiedroStore()
  return (
    <div className="space-y-1">
      {[['Plano Horizontal (PH)', mostrarPH, togglePH], ['Plano Vertical (PV)', mostrarPV, togglePV], ['Proyecciones y refs.', mostrarReferencias, toggleReferencias]].map(([label, activo, toggle]) => (
        <div key={label} className="flex items-center justify-between px-1 py-1">
          <span className="text-xs font-mono text-neutral-500">{label}</span>
          <button onClick={toggle} className={activo ? 'text-[#00ffcc]' : 'text-neutral-700'}><IconEye open={activo} /></button>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const { modoHerramienta, setModoHerramienta, clearAll } = useDiedroStore()

  const herramientas = [
    { id: 'punto', label: 'Punto', icon: <IconPoint /> },
    { id: 'recta', label: 'Recta', icon: <IconLine /> },
    { id: 'plano', label: 'Plano', icon: <IconLayers /> },
  ]

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0a] text-neutral-200">
      <div className="h-10 bg-[#0d0d0d] border-b border-[#1a1a1a] flex items-center px-4 gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 mr-4">
          <div className="w-5 h-5 border border-[#00ffcc55] flex items-center justify-center"><div className="w-2 h-2 bg-[#00ffcc]" /></div>
          <span className="font-mono text-xs text-[#00ffcc] tracking-[0.25em] uppercase font-bold">DiedroCad</span>
        </div>
        <div className="h-4 w-px bg-[#1a1a1a]" />
        {herramientas.map(h => (
          <button key={h.id} onClick={() => setModoHerramienta(h.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${modoHerramienta === h.id ? 'bg-[#00ffcc22] border border-[#00ffcc44] text-[#00ffcc]' : 'text-neutral-600 hover:text-neutral-400'}`}>
            {h.icon}{h.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => { if (window.confirm('¿Limpiar todo?')) clearAll() }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-neutral-700 hover:text-red-400 transition-all">
          <IconTrash />Limpiar
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col flex-shrink-0 overflow-y-auto">
          <Seccion titulo="Entrada" icono={<IconPoint />}>
            {modoHerramienta === 'punto' && <FormularioPunto />}
            {modoHerramienta === 'recta' && <FormularioRecta />}
            {modoHerramienta === 'plano' && <FormularioPlano />}
          </Seccion>
          <Seccion titulo="Entidades" icono={<IconLine />}>
            <ListaEntidades />
          </Seccion>
          <Seccion titulo="Capas" icono={<IconLayers />} defaultOpen={false}>
            <PanelCapas />
          </Seccion>
          <div className="mt-auto p-4 border-t border-[#1a1a1a]">
            {[['PH', 'cota=0', '#00ccaa'], ['PV', 'alej=0', '#0088ff'], ['LT', 'eje X', '#ffffff'], ['Y≥0,Z≥0', 'Visible', '#00ffcc'], ['otros', 'Oculto', '#ff6666']].map(([k, v, c]) => (
              <div key={k} className="flex justify-between"><span className="text-[10px] font-mono" style={{ color: c }}>{k}</span><span className="text-[10px] font-mono text-neutral-700">{v}</span></div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative">
            <DiedroScene />
          </div>
          <div className="w-[520px] flex-shrink-0">
            <Vista2D />
          </div>
        </div>
      </div>
    </div>
  )
}
