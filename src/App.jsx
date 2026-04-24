import { useState, useCallback } from 'react'

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

// Always round UP to the next larger table value. If above max, cap at max.
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
    price:  TABLE[usedW][li],
    usedW,
    usedL,
    exactW: usedW === w,
    exactL: usedL === len,
    cappedW: w   > WIDTHS[WIDTHS.length - 1],
    cappedL: len > LENGTHS[LENGTHS.length - 1],
  }
}

// ---------------------------------------------------------------------------
// Styles (CSS-in-JS object map)
// ---------------------------------------------------------------------------
const C = {
  bg:        '#1c1c1c',
  surface:   '#262626',
  elevated:  '#2e2e2e',
  border:    '#3a3a3a',
  red:       '#c0392b',
  redHover:  '#e74c3c',
  redMuted:  'rgba(192,57,43,0.15)',
  text:      '#e8e8e8',
  muted:     '#888',
  faint:     '#555',
  green:     '#2ecc71',
}

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
    borderBottom: `1px solid ${C.border}`,
    padding: '20px 0 16px',
    marginBottom: 32,
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: C.text,
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
  },
  redBar: {
    width: 3,
    height: 22,
    background: C.red,
    borderRadius: 2,
    marginRight: 4,
    flexShrink: 0,
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
  },
  input: {
    background: C.elevated,
    border: `1px solid ${C.border}`,
    borderRadius: 5,
    color: C.text,
    fontSize: 15,
    padding: '9px 12px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  hint: {
    fontSize: 11,
    color: C.faint,
    marginTop: 2,
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${C.border}`,
    margin: '4px 0 20px',
  },
  toggleWrap: {
    display: 'flex',
    border: `1px solid ${C.border}`,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
    width: 'fit-content',
  },
  toggleBtn: (active) => ({
    padding: '7px 18px',
    fontSize: 13,
    background: active ? C.red : 'transparent',
    color: active ? '#fff' : C.muted,
    border: 'none',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    transition: 'background 0.15s, color 0.15s',
  }),
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
    gridTemplateColumns: 'repeat(3, 1fr)',
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
  const [mode,       setMode]      = useState('lbs')
  const [width,      setWidth]     = useState('')
  const [length,     setLength]    = useState('')
  const [totalLbs,   setTotalLbs]  = useState('')
  const [qty,        setQty]       = useState('')
  const [lbsPer,     setLbsPer]    = useState('')

  const [inputFocus, setInputFocus] = useState(null)

  const w   = parseFloat(width)
  const len = parseFloat(length)

  const hasSize  = w > 0 && len > 0
  const result   = hasSize ? getPrice(w, len) : null

  const computedLbs = useCallback(() => {
    if (mode === 'lbs') return parseFloat(totalLbs) || 0
    const q = parseFloat(qty) || 0
    const p = parseFloat(lbsPer) || 0
    return q > 0 && p > 0 ? q * p : 0
  }, [mode, totalLbs, qty, lbsPer])

  const lbs      = computedLbs()
  const perLb    = result && lbs > 0 ? result.price / lbs : null

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

  function inputStyle(field) {
    return {
      ...s.input,
      borderColor: inputFocus === field ? C.red : C.border,
    }
  }

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.redBar} />
        <span style={s.title}>Pack Cost Calculator</span>
        <span style={s.subtitle}>Champagne Metals</span>
      </div>

      {/* Skid Dimensions */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Skid Dimensions</div>
        <div style={s.row2}>
          <div style={s.field}>
            <label style={s.label}>Width (in)</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 23"
              value={width}
              onChange={e => setWidth(e.target.value)}
              onFocus={() => setInputFocus('w')}
              onBlur={() => setInputFocus(null)}
              style={inputStyle('w')}
            />
            <span style={s.hint}>table range: 24 – 96</span>
          </div>
          <div style={s.field}>
            <label style={s.label}>Length (in)</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 131.52"
              value={length}
              onChange={e => setLength(e.target.value)}
              onFocus={() => setInputFocus('l')}
              onBlur={() => setInputFocus(null)}
              style={inputStyle('l')}
            />
            <span style={s.hint}>table range: 48 – 480</span>
          </div>
        </div>
      </div>

      {/* Weight Input */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Weight</div>

        <div style={s.toggleWrap}>
          <button
            style={s.toggleBtn(mode === 'lbs')}
            onClick={() => setMode('lbs')}
          >
            Total lbs
          </button>
          <button
            style={s.toggleBtn(mode === 'qty')}
            onClick={() => setMode('qty')}
          >
            Qty + lbs/unit
          </button>
        </div>

        {mode === 'lbs' ? (
          <div style={{ ...s.field, maxWidth: 260 }}>
            <label style={s.label}>Total lbs on skid</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 2400"
              value={totalLbs}
              onChange={e => setTotalLbs(e.target.value)}
              onFocus={() => setInputFocus('tlbs')}
              onBlur={() => setInputFocus(null)}
              style={inputStyle('tlbs')}
            />
          </div>
        ) : (
          <div style={s.row2}>
            <div style={s.field}>
              <label style={s.label}>Qty (pieces)</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 60"
                value={qty}
                onChange={e => setQty(e.target.value)}
                onFocus={() => setInputFocus('qty')}
                onBlur={() => setInputFocus(null)}
                style={inputStyle('qty')}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Lbs per piece</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 40"
                value={lbsPer}
                onChange={e => setLbsPer(e.target.value)}
                onFocus={() => setInputFocus('lbsPer')}
                onBlur={() => setInputFocus(null)}
                style={inputStyle('lbsPer')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result ? (
        <div style={s.resultCard}>
          <div style={s.resultHeader}>Result</div>
          <div style={s.resultBody}>
            <div style={{
              ...s.metricsRow,
              gridTemplateColumns: perLb
                ? (mode === 'qty' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)')
                : 'repeat(2, 1fr)',
            }}>
              <div style={s.metric}>
                <div style={s.metricLabel}>Pack cost</div>
                <div style={s.metricVal}>${result.price.toFixed(2)}</div>
              </div>

              {mode === 'qty' && lbs > 0 && (
                <div style={s.metric}>
                  <div style={s.metricLabel}>Total lbs</div>
                  <div style={s.metricVal}>{lbs.toLocaleString()}</div>
                </div>
              )}

              {perLb !== null ? (
                <div style={s.metric}>
                  <div style={s.metricLabel}>Per lb cost</div>
                  <div style={s.metricValGreen}>${perLb.toFixed(4)}</div>
                </div>
              ) : (
                <div style={s.metric}>
                  <div style={{ ...s.metricLabel, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
                    Enter weight above to calculate per lb cost
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
