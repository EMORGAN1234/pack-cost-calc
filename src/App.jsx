import { useState } from 'react'

// ---------------------------------------------------------------------------
// Pricing table  (rows = width, cols = length)
// ---------------------------------------------------------------------------
const WIDTHS  = [24, 36, 48, 60, 72, 85, 96]
const LENGTHS = [48, 96, 120, 144, 192, 240, 300, 360, 420, 480]

const TABLE = {
  24: [24,  33,  41,  45,  113, 117, 137, 184, 209, 216],
  36: [31,  43,  52,  59,  123, 127, 146, 194, 228, 235],
  48: [33,  46,  56,  63,  127, 134, 154, 204, 238, 247],
  60: [36,  48,  59,  67,  154, 161, 188, 238, 294, 304],
  72: [39,  59,  73,  82,  164, 172, 202, 296, 317, 329],
  85: [40,  61,  76,  85,  167, 176, 207, 302, 324, 337],
  96: [49,  70,  88,  99,  195, 206, 242, 360, 386, 400],
}

function ceilIndex(arr, val) {
  const i = arr.findIndex(v => v >= val)
  return i < 0 ? arr.length - 1 : i
}

function getPrice(w, len) {
  const wi = ceilIndex(WIDTHS,  w)
  const li = ceilIndex(LENGTHS, len)
  const usedW = WIDTHS[wi]
  const usedL = LENGTHS[li]
  return {
    price:   TABLE[usedW][li],
    usedW,
    usedL,
    exactW:  usedW === w,
    exactL:  usedL === len,
    cappedW: w   > WIDTHS[WIDTHS.length - 1],
    cappedL: len > LENGTHS[LENGTHS.length - 1],
  }
}

export default function App() {

  // ---- Skid dimensions + max weight ---------------------------------------
  const [width,  setWidth]  = useState('')
  const [length, setLength] = useState('')
  const [maxWt,  setMaxWt]  = useState('4000')

  // ---- Drop lbs (drives skid count) ---------------------------------------
  const [dropLbs, setDropLbs] = useState('')

  // ---- Order lbs (drives per lb cost for quote) ---------------------------
  // Dynamic: fill any 2 of qty / lbsPc / totalLbs
  const [qty,      setQty]      = useState('1')
  const [lbsPc,    setLbsPc]    = useState('')
  const [orderLbs, setOrderLbs] = useState('')
  const [editOrder, setEditOrder] = useState(['qty'])

  // ---- Order lbs dynamic logic --------------------------------------------
  const ALL_FIELDS = ['qty', 'lbsPc', 'orderLbs']
  const autoField  = editOrder.length >= 2
    ? ALL_FIELDS.find(f => !editOrder.slice(0, 2).includes(f))
    : null

  const qNum = parseFloat(qty)      || 0
  const lNum = parseFloat(lbsPc)    || 0
  const oNum = parseFloat(orderLbs) || 0

  let dispQty      = qty
  let dispLbsPc    = lbsPc
  let dispOrderLbs = orderLbs

  if (autoField === 'orderLbs' && qNum > 0 && lNum > 0) {
    dispOrderLbs = (qNum * lNum).toFixed(2)
  } else if (autoField === 'lbsPc' && qNum > 0 && oNum > 0) {
    dispLbsPc = (oNum / qNum).toFixed(4)
  } else if (autoField === 'qty' && lNum > 0 && oNum > 0) {
    dispQty = (oNum / lNum).toFixed(2)
  }

  const finalOrderLbs = parseFloat(dispOrderLbs) || 0

  function touch(field) {
    setEditOrder(prev => [field, ...prev.filter(f => f !== field)].slice(0, 2))
  }

  // ---- Skid count (based on drop lbs) -------------------------------------
  const dropLbsNum = parseFloat(dropLbs) || 0
  const maxWtNum   = parseFloat(maxWt)   || 0
  const skidCount  = maxWtNum > 0 && dropLbsNum > 0
    ? Math.ceil(dropLbsNum / maxWtNum)
    : 1
  const multiSkid  = skidCount > 1

  // ---- Price lookup -------------------------------------------------------
  const w   = parseFloat(width)
  const len = parseFloat(length)
  const hasSize       = w > 0 && len > 0
  const result        = hasSize ? getPrice(w, len) : null
  const packPerSkid   = result ? result.price : 0
  const totalPackCost = packPerSkid * skidCount
  const perLb         = result && finalOrderLbs > 0 ? totalPackCost / finalOrderLbs : null

  function noteText() {
    if (!result) return null
    const { exactW, exactL, usedW, usedL, cappedW, cappedL } = result
    if (exactW && exactL) return { text: `Exact table match — ${usedW}" × ${usedL}".`, exact: true }
    const parts = []
    if (!exactW) parts.push(cappedW ? `width capped at max ${usedW}"` : `width rounded up to ${usedW}"`)
    if (!exactL) parts.push(cappedL ? `length capped at max ${usedL}"` : `length rounded up to ${usedL}"`)
    return { text: `Using table size ${usedW}" × ${usedL}" — ${parts.join(', ')}.`, exact: false }
  }

  const note = noteText()

  const inputBase = "w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
  const inputNormal = `${inputBase} bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-red-400`
  const inputAuto = `${inputBase} bg-blue-50 border-blue-200 text-blue-700 font-medium cursor-default`

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .glass-card { background: rgba(255,255,255,0.97); backdrop-filter: blur(20px); }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 5px rgba(220,38,38,0.3); } 50% { box-shadow: 0 0 20px rgba(220,38,38,0.6); } }
      `}} />

      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-black p-4 sm:p-6"
           style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-3xl mx-auto">

          {/* ── HEADER CARD ───────────────────────────────────────────── */}
          <div className="glass-card rounded-2xl shadow-2xl p-5 mb-5 border-t-4 border-red-600">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg pulse-glow text-2xl">
                📦
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">Pack Cost Calculator</h1>
                <p className="text-sm text-neutral-500 font-medium">Skid pack cost &amp; per lb quote pricing</p>
              </div>
            </div>
          </div>

          {/* ── SKID SETUP CARD ──────────────────────────────────────── */}
          <div className="glass-card rounded-2xl shadow-2xl p-5 mb-5 border-t-4 border-red-600">
            <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Skid Setup</div>
            <p className="text-sm text-neutral-500 mb-4">
              The drop/remainder skid size and capacity — determines pack cost per skid and how many skids are needed.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Width (in)</label>
                <input
                  type="number" min="0" step="any" placeholder="e.g. 23"
                  value={width}
                  onChange={e => setWidth(e.target.value)}
                  className={inputNormal}
                />
                <span className="block text-[11px] text-neutral-400 mt-1">table range: 24 – 96</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Length (in)</label>
                <input
                  type="number" min="0" step="any" placeholder="e.g. 131.52"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                  className={inputNormal}
                />
                <span className="block text-[11px] text-neutral-400 mt-1">table range: 48 – 480</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Max Wt / Skid (lbs)</label>
                <input
                  type="number" min="0" step="any" placeholder="4000"
                  value={maxWt}
                  onChange={e => setMaxWt(e.target.value)}
                  className={inputNormal}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Total Lbs</label>
                <input
                  type="number" min="0" step="any" placeholder="e.g. 800"
                  value={dropLbs}
                  onChange={e => setDropLbs(e.target.value)}
                  className={inputNormal}
                />
                <span className="block text-[11px] text-neutral-400 mt-1">lbs of material being packed</span>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 mb-1.5">
                  Pc Count
                  {autoField === 'qty' && <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 rounded px-1.5 py-0.5">calc</span>}
                </label>
                <input
                  type="number" min="0" step="1" placeholder="1"
                  value={dispQty}
                  readOnly={autoField === 'qty'}
                  onChange={e => { setQty(e.target.value); touch('qty') }}
                  className={autoField === 'qty' ? inputAuto : inputNormal}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 mb-1.5">
                  Lbs / Pc
                  {autoField === 'lbsPc' && <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 rounded px-1.5 py-0.5">calc</span>}
                </label>
                <input
                  type="number" min="0" step="any" placeholder="e.g. 260"
                  value={dispLbsPc}
                  readOnly={autoField === 'lbsPc'}
                  onChange={e => { setLbsPc(e.target.value); touch('lbsPc') }}
                  className={autoField === 'lbsPc' ? inputAuto : inputNormal}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div></div>
              <div></div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 mb-1.5">
                  Total Order Lbs
                  {autoField === 'orderLbs' && <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 rounded px-1.5 py-0.5">calc</span>}
                </label>
                <input
                  type="number" min="0" step="any" placeholder="e.g. 260"
                  value={dispOrderLbs}
                  readOnly={autoField === 'orderLbs'}
                  onChange={e => { setOrderLbs(e.target.value); touch('orderLbs') }}
                  className={autoField === 'orderLbs' ? inputAuto : inputNormal}
                />
              </div>
            </div>

            {/* Multi-skid warning */}
            {multiSkid && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-xl px-4 py-3 mt-4">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span>
                  <strong>{dropLbsNum.toLocaleString()} lbs</strong> drop ÷ {maxWtNum.toLocaleString()} lbs/skid
                  {' '}= <strong>{skidCount} skids</strong> needed. Pack cost × {skidCount}.
                </span>
              </div>
            )}
          </div>

          {/* ── RESULT CARD ──────────────────────────────────────────── */}
          {result ? (
            <div className="glass-card rounded-2xl shadow-2xl overflow-hidden border-t-4 border-red-600">
              <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">Result</span>
                {multiSkid && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-3 py-1">
                    {skidCount} skids × ${packPerSkid.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className={`grid ${multiSkid ? 'grid-cols-3' : 'grid-cols-2'} gap-5 mb-5`}>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Pack Cost / Skid</div>
                    <div className="text-2xl font-extrabold text-neutral-900">${packPerSkid.toFixed(2)}</div>
                  </div>
                  {multiSkid && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Skids Needed</div>
                      <div className="text-2xl font-extrabold text-neutral-900">{skidCount}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{dropLbsNum.toLocaleString()} drop lbs ÷ {maxWtNum.toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">Total Pack Cost</div>
                    <div className="text-2xl font-extrabold text-neutral-900">${totalPackCost.toFixed(2)}</div>
                    {multiSkid && <div className="text-[11px] text-neutral-400 mt-0.5">${packPerSkid.toFixed(2)} × {skidCount}</div>}
                  </div>
                </div>

                <hr className="border-neutral-200 mb-5" />

                {perLb !== null ? (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-5 py-4 mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Per Lb Pack Cost (Col Y)</div>
                    <div className="text-3xl font-extrabold text-emerald-700">${perLb.toFixed(4)}</div>
                    <div className="text-[11px] text-neutral-500 mt-1">
                      ${totalPackCost.toFixed(2)} total pack ÷ {finalOrderLbs.toLocaleString()} order lbs
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-400 mb-5">
                    Enter order lbs above to calculate per lb pack cost (Col Y).
                  </div>
                )}

                <div className={`flex items-center gap-2 pt-3 border-t border-neutral-200 text-sm ${note.exact ? 'text-emerald-600' : 'text-neutral-500'}`}>
                  {note.exact ? <span>✓</span> : <span>↑</span>}
                  <span>{note.text}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl shadow-2xl p-5 border-t-4 border-red-600">
              <p className="text-sm text-neutral-400">Enter drop skid dimensions to begin.</p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
