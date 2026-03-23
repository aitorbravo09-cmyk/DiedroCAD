import { useState } from 'react'
import useDiedroStore from '../store/useDiedroStore'

const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export default function PanelIntersecciones() {
  const { planos, rectas, intersecciones, calcularInterseccion, removeInterseccion } = useDiedroStore()
  const [sel1, setSel1] = useState('')
  const [sel2, setSel2] = useState('')
  const [error, setError] = useState('')

  const entidades = [
    ...planos.map(p => ({ id: p.id, nombre: p.nombre, tipo: 'plano', color: p.color })),
    ...rectas.map(r => ({ id: r.id, nombre: r.nombre, tipo: 'recta', color: '#00ffcc' })),
  ]

  const handleCalcular = () => {
    if (!sel1 || !sel2) { setError('Selecciona dos entidades.'); return }
    if (sel1 === sel2) { setError('Selecciona entidades distintas.'); return }
    setError('')
    const id = calcularInterseccion(sel1, sel2)
    if (!id) setError('Sin intersección (paralelas o incompatibles).')
    else { setSel1(''); setSel2('') }
  }

  return (
    <div className="space-y-2">
      {[['1', sel1, setSel1], ['2', sel2, setSel2]].map(([n, val, set]) => (
        <div key={n}>
          <label className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mb-0.5 block">
            Entidad {n}
          </label>
          <select value={val} onChange={e => set(e.target.value)}
            className="w-full bg-[#111] border border-[#2a2a2a] text-neutral-300 text-sm font-mono px-2 py-1.5 rounded focus:outline-none appearance-none">
            <option value="">— seleccionar —</option>
            {entidades.map(e => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({e.tipo})
              </option>
            ))}
          </select>
        </div>
      ))}

      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

      <button onClick={handleCalcular}
        className="w-full bg-[#ffffff11] hover:bg-[#ffffff22] border border-[#ffffff22] hover:border-[#ffffff44] text-white text-sm font-mono py-2 rounded transition-all active:scale-95">
        ∩ Calcular Intersección
      </button>

      {intersecciones.length > 0 && (
        <div className="mt-1 space-y-1">
          <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">Resultados</p>
          {intersecciones.map(i => (
            <div key={i.id}
              className="flex items-center justify-between px-2 py-1.5 rounded bg-[#ffffff08] border border-[#ffffff11]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: i.color }}>
                  {i.subTipo === 'recta' ? '∩ r' : '∩ p'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[130px]">{i.nombre}</span>
              </div>
              <button onClick={() => removeInterseccion(i.id)}
                className="text-neutral-700 hover:text-red-400 transition-colors">
                <IconX />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}