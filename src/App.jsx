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

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const C = {
  bg:         '#141414',
  surface:    '#ffffff',
  elevated:   '#f5f5f5',
  auto:       '#eef6ff',
  autoBorder: '#a8cff5',
  border:     '#e0e0e0',
  red:        '#c0392b',
  redMuted:   'rgba(192,57,43,0.08)',
  text:       '#1a1a1a',
  muted:      '#666',
  faint:      '#999',
  green:      '#1a9e4a',
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px 60px',
  },
  header: {
    width: '100%',
    maxWidth: 600,
    borderBottom: '1px solid #2a2a2a',
    padding: '20px 0 16px',
    marginBottom: 32,
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  redBar: {
    width: 3,
    height: 22,
    background: C.red,
    borderRadius: 2,
    marginRight: 4,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  card: {
    width: '100%',
    maxWidth: 600,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '24px 28px',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.red,
    marginBottom: 14,
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: C.muted,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  calcBadge: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#1a6bbf',
    background: '#ddeeff',
    borderRadius: 3,
    padding: '1px 5px',
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 11,
    color: C.faint,
    marginTop: 2,
  },
  resultCard: {
    width: '100%',
    maxWidth: 600,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultHeader: {
    background: C.redMuted,
    borderBottom: `1px solid ${C.border}`,
    padding: '10px 28px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.red,
  },
  resultBody: {
    padding: '20px 28px',
  },
  metricsRow: {
    display: 'grid',
    gap: 20,
    marginBottom: 16,
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 600,
    color: C.text,
  },
  metricValGreen: {
    fontSize: 24,
    fontWeight: 600,
    color: C.green,
  },
  lookupNote: {
    borderTop: `1px solid ${C.border}`,
    paddingTop: 12,
    fontSize: 12,
    color: C.muted,
    lineHeight: 1.6,
  },
  lookupNoteExact: {
    borderTop: `1px solid ${C.border}`,
    paddingTop: 12,
    fontSize: 12,
    color: C.green,
    lineHeight: 1.6,
  },
  promptText: {
    padding: '20px 28px',
    fontSize: 13,
    color: C.faint,
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function App() {
  const [width,    setWidth]    = useState('')
  const [length,   setLength]   = useState('')

  // Raw string values for the three linked fields
  const [qty,      setQty]      = useState('1')   // default pc count = 1
  const [lbsPc,    setLbsPc]    = useState('')
  const [totalLbs, setTotalLbs] = useState('')

  // editOrder tracks which fields the user has manually touched, most recent first.
  // The field NOT in the first two positions is auto-calculated.
  const [editOrder, setEditOrder] = useState(['qty'])

  const [focus, setFocus] = useState(null)

  // ---- determine auto field ------------------------------------------------
  const ALL_FIELDS = ['qty', 'lbsPc', 'totalLbs']
  const autoField  = editOrder.length >= 2
    ? ALL_FIELDS.find(f => !editOrder.slice(0, 2).includes(f))
    : null

  // ---- compute auto value --------------------------------------------------
  const qNum = parseFloat(qty)      || 0
  const lNum = parseFloat(lbsPc)    || 0
  const tNum = parseFloat(totalLbs) || 0

  let dispQty      = qty
  let dispLbsPc    = lbsPc
  let dispTotalLbs = totalLbs

  if (autoField === 'totalLbs' && qNum > 0 && lNum > 0) {
    dispTotalLbs = (qNum * lNum).toFixed(2)
  } else if (autoField === 'lbsPc' && qNum > 0 && tNum > 0) {
    dispLbsPc = (tNum / qNum).toFixed(4)
  } else if (autoField === 'qty' && lNum > 0 && tNum > 0) {
    dispQty = (tNum / lNum).toFixed(2)
  }

  // Final lbs used for per-lb calc
  const finalLbs = parseFloat(dispTotalLbs) || 0

  // ---- touch handler -------------------------------------------------------
  function touch(field) {
    setEditOrder(prev => [field, ...prev.filter(f => f !== field)].slice(0, 2))
  }

  // ---- price lookup --------------------------------------------------------
  const w   = parseFloat(width)
  const len = parseFloat(length)
  const hasSize = w > 0 && len > 0
  const result  = hasSize ? getPrice(w, len) : null
  const perLb   = result && finalLbs > 0 ? result.price / finalLbs : null

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

  // ---- input style ---------------------------------------------------------
  function inputStyle(field) {
    const isAuto = autoField === field
    return {
      background:   isAuto ? C.auto    : C.elevated,
      border:       `1px solid ${focus === field ? C.red : isAuto ? C.autoBorder : C.border}`,
      borderRadius: 5,
      color:        isAuto ? '#1a6bbf' : C.text,
      fontSize:     15,
      fontWeight:   isAuto ? 500       : 400,
      padding:      '9px 12px',
      outline:      'none',
      width:        '100%',
      transition:   'border-color 0.15s',
      cursor:       isAuto ? 'default' : 'text',
    }
  }

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.redBar} />
        <span style={s.title}>Pack Cost Calculator</span>
        
      </div>

      {/* Skid Dimensions */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Skid Dimensions</div>
        <div style={s.row2}>
          <div style={s.field}>
            <label style={s.label}>Width (in)</label>
            <input
              type="number" min="0" step="any" placeholder="e.g. 23"
              value={width}
              onChange={e => setWidth(e.target.value)}
              onFocus={() => setFocus('w')}
              onBlur={() => setFocus(null)}
              style={inputStyle('w')}
            />
            <span style={s.hint}>table range: 24 – 96</span>
          </div>
          <div style={s.field}>
            <label style={s.label}>Length (in)</label>
            <input
              type="number" min="0" step="any" placeholder="e.g. 131.52"
              value={length}
              onChange={e => setLength(e.target.value)}
              onFocus={() => setFocus('l')}
              onBlur={() => setFocus(null)}
              style={inputStyle('l')}
            />
            <span style={s.hint}>table range: 48 – 480</span>
          </div>
        </div>
      </div>

      {/* Weight — fill any 2, third auto-calculates */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Weight</div>
        <div style={s.row3}>

          <div style={s.field}>
            <label style={s.label}>
              Pc Count
              {autoField === 'qty' && <span style={s.calcBadge}>calc</span>}
            </label>
            <input
              type="number" min="0" step="1" placeholder="1"
              value={dispQty}
              readOnly={autoField === 'qty'}
              onChange={e => { setQty(e.target.value); touch('qty') }}
              onFocus={() => setFocus('qty')}
              onBlur={() => setFocus(null)}
              style={inputStyle('qty')}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>
              Lbs / Pc
              {autoField === 'lbsPc' && <span style={s.calcBadge}>calc</span>}
            </label>
            <input
              type="number" min="0" step="any" placeholder="e.g. 40"
              value={dispLbsPc}
              readOnly={autoField === 'lbsPc'}
              onChange={e => { setLbsPc(e.target.value); touch('lbsPc') }}
              onFocus={() => setFocus('lbsPc')}
              onBlur={() => setFocus(null)}
              style={inputStyle('lbsPc')}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>
              Total Lbs
              {autoField === 'totalLbs' && <span style={s.calcBadge}>calc</span>}
            </label>
            <input
              type="number" min="0" step="any" placeholder="e.g. 2400"
              value={dispTotalLbs}
              readOnly={autoField === 'totalLbs'}
              onChange={e => { setTotalLbs(e.target.value); touch('totalLbs') }}
              onFocus={() => setFocus('totalLbs')}
              onBlur={() => setFocus(null)}
              style={inputStyle('totalLbs')}
            />
          </div>

        </div>
      </div>

      {/* Result */}
      {result ? (
        <div style={s.resultCard}>
          <div style={s.resultHeader}>Result</div>
          <div style={s.resultBody}>
            <div style={{
              ...s.metricsRow,
              gridTemplateColumns: perLb ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            }}>
              <div style={s.metric}>
                <div style={s.metricLabel}>Pack cost</div>
                <div style={s.metricVal}>${result.price.toFixed(2)}</div>
              </div>

              {finalLbs > 0 && (
                <div style={s.metric}>
                  <div style={s.metricLabel}>Total lbs</div>
                  <div style={s.metricVal}>{finalLbs.toLocaleString()}</div>
                </div>
              )}

              {perLb !== null ? (
                <div style={s.metric}>
                  <div style={s.metricLabel}>Per lb cost</div>
                  <div style={s.metricValGreen}>${perLb.toFixed(4)}</div>
                </div>
              ) : (
                <div style={s.metric}>
                  <div style={{ fontSize: 13, color: C.faint, paddingTop: 4 }}>
                    Enter weight to calculate per lb cost
                  </div>
                </div>
              )}
            </div>

            <div style={note.exact ? s.lookupNoteExact : s.lookupNote}>
              {note.exact ? '✓ ' : '↑ '}{note.text}
            </div>
          </div>
        </div>
      ) : (
        <div style={s.resultCard}>
          <div style={s.promptText}>Enter skid dimensions to calculate pack cost.</div>
        </div>
      )}

    </div>
  )
}
