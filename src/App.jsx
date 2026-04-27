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
  warn:       '#fff8ee',
  warnBorder: '#f5c842',
  warnText:   '#8a6000',
  border:     '#e0e0e0',
  red:        '#c0392b',
  redMuted:   'rgba(192,57,43,0.08)',
  text:       '#1a1a1a',
  muted:      '#666',
  faint:      '#999',
  green:      '#1a9e4a',
  greenMuted: 'rgba(26,158,74,0.08)',
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
    maxWidth: 640,
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
    maxWidth: 640,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '22px 26px',
    marginBottom: 14,
  },
  cardGreen: {
    width: '100%',
    maxWidth: 640,
    background: C.surface,
    border: `1px solid #b2dfc2`,
    borderRadius: 8,
    padding: '22px 26px',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.red,
    marginBottom: 4,
  },
  sectionLabelGreen: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.green,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
  },
  row2_1: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 160px',
    gap: 16,
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
  multiSkidBanner: {
    background: C.warn,
    border: `1px solid ${C.warnBorder}`,
    borderRadius: 6,
    padding: '10px 14px',
    marginTop: 14,
    fontSize: 13,
    color: C.warnText,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    lineHeight: 1.5,
  },
  resultCard: {
    width: '100%',
    maxWidth: 640,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultHeader: {
    background: C.redMuted,
    borderBottom: `1px solid ${C.border}`,
    padding: '10px 26px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: C.red,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skidsBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: C.warnText,
    background: C.warn,
    border: `1px solid ${C.warnBorder}`,
    borderRadius: 4,
    padding: '2px 10px',
  },
  resultBody: {
    padding: '20px 26px',
  },
  metricsGrid: {
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
    fontSize: 28,
    fontWeight: 700,
    color: C.green,
  },
  metricSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${C.border}`,
    margin: '16px 0',
  },
  perLbHighlight: {
    background: C.greenMuted,
    border: `1px solid #b2dfc2`,
    borderRadius: 8,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 16,
  },
  perLbLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
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
    padding: '20px 26px',
    fontSize: 13,
    color: C.faint,
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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

  const [focus, setFocus] = useState(null)

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

  // ---- Input style --------------------------------------------------------
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

      {/* ── CARD 1: Drop Skid Setup ────────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Skid Setup</div>
        <div style={s.sectionDesc}>
          The drop/remainder skid size and capacity — determines pack cost per skid and how many skids are needed.
        </div>

        <div style={{ ...s.row2_1, marginBottom: 16 }}>
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
          <div style={s.field}>
            <label style={s.label}>Max Wt / Skid (lbs)</label>
            <input
              type="number" min="0" step="any" placeholder="4000"
              value={maxWt}
              onChange={e => setMaxWt(e.target.value)}
              onFocus={() => setFocus('maxWt')}
              onBlur={() => setFocus(null)}
              style={inputStyle('maxWt')}
            />
          </div>
        </div>

        <div style={{ maxWidth: 200 }}>
          <div style={s.field}>
            <label style={s.label}>Total Lbs</label>
            <input
              type="number" min="0" step="any" placeholder="e.g. 800"
              value={dropLbs}
              onChange={e => setDropLbs(e.target.value)}
              onFocus={() => setFocus('dropLbs')}
              onBlur={() => setFocus(null)}
              style={inputStyle('dropLbs')}
            />
            <span style={s.hint}>lbs of material being packed</span>
          </div>
        </div>

        {/* Multi-skid warning */}
        {multiSkid && (
          <div style={s.multiSkidBanner}>
            <span style={{ fontSize: 16 }}>⚠</span>
            <span>
              <strong>{dropLbsNum.toLocaleString()} lbs</strong> drop ÷ {maxWtNum.toLocaleString()} lbs/skid
              {' '}= <strong>{skidCount} skids</strong> needed.
              Pack cost × {skidCount}.
            </span>
          </div>
        )}
      </div>

      {/* ── CARD 2: Order Lbs ─────────────────────────────────────────── */}
      <div style={s.cardGreen}>
        <div style={s.sectionLabelGreen}>Order — Quote Line Lbs</div>
        <div style={s.sectionDesc}>
          The actual pieces being quoted. Per lb pack cost = total pack cost ÷ these lbs.
        </div>

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
              type="number" min="0" step="any" placeholder="e.g. 260"
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
              Total Order Lbs
              {autoField === 'orderLbs' && <span style={s.calcBadge}>calc</span>}
            </label>
            <input
              type="number" min="0" step="any" placeholder="e.g. 260"
              value={dispOrderLbs}
              readOnly={autoField === 'orderLbs'}
              onChange={e => { setOrderLbs(e.target.value); touch('orderLbs') }}
              onFocus={() => setFocus('orderLbs')}
              onBlur={() => setFocus(null)}
              style={inputStyle('orderLbs')}
            />
          </div>
        </div>
      </div>

      {/* ── RESULT ───────────────────────────────────────────────────────── */}
      {result ? (
        <div style={s.resultCard}>
          <div style={s.resultHeader}>
            <span>Result</span>
            {multiSkid && (
              <span style={s.skidsBadge}>{skidCount} skids × ${packPerSkid.toFixed(2)}</span>
            )}
          </div>
          <div style={s.resultBody}>

            {/* Pack cost breakdown */}
            <div style={{ ...s.metricsGrid, gridTemplateColumns: multiSkid ? 'repeat(3, 1fr)' : '1fr 1fr', marginBottom: 16 }}>
              <div style={s.metric}>
                <div style={s.metricLabel}>Pack Cost / Skid</div>
                <div style={s.metricVal}>${packPerSkid.toFixed(2)}</div>
              </div>
              {multiSkid && (
                <div style={s.metric}>
                  <div style={s.metricLabel}>Skids Needed</div>
                  <div style={s.metricVal}>{skidCount}</div>
                  <div style={s.metricSub}>{dropLbsNum.toLocaleString()} drop lbs ÷ {maxWtNum.toLocaleString()}</div>
                </div>
              )}
              <div style={s.metric}>
                <div style={s.metricLabel}>Total Pack Cost</div>
                <div style={s.metricVal}>${totalPackCost.toFixed(2)}</div>
                {multiSkid && <div style={s.metricSub}>${packPerSkid.toFixed(2)} × {skidCount}</div>}
              </div>
            </div>

            <hr style={s.divider} />

            {/* Per lb highlight */}
            {perLb !== null ? (
              <div style={s.perLbHighlight}>
                <div style={s.perLbLabel}>Per Lb Pack Cost (Col Y)</div>
                <div style={s.metricValGreen}>${perLb.toFixed(4)}</div>
                <div style={s.metricSub}>
                  ${totalPackCost.toFixed(2)} total pack ÷ {finalOrderLbs.toLocaleString()} order lbs
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.faint, marginBottom: 16 }}>
                Enter order lbs above to calculate per lb pack cost (Col Y).
              </div>
            )}

            <div style={note.exact ? s.lookupNoteExact : s.lookupNote}>
              {note.exact ? '✓ ' : '↑ '}{note.text}
            </div>
          </div>
        </div>
      ) : (
        <div style={s.resultCard}>
          <div style={s.promptText}>Enter drop skid dimensions to begin.</div>
        </div>
      )}

    </div>
  )
}
