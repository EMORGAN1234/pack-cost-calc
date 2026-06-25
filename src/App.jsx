import { useState } from 'react'

// ---------------------------------------------------------------------------
// Pricing table  (rows = width, cols = length)
// ---------------------------------------------------------------------------
const WIDTHS  = [24, 36, 48, 60, 72, 84, 96]
const LENGTHS = [48, 96, 120, 144, 192, 240, 300, 360, 420, 480]

const TABLE = {
  24: [26,  34,  42,  47,  124, 127, 151, 204, 211, 239],
  36: [32,  45,  55,  61,  135, 140, 161, 216, 230, 261],
  48: [34,  48,  59,  66,  138, 146, 170, 226, 239, 274],
  60: [37,  50,  62,  70,  146, 154, 209, 264, 328, 339],
  72: [41,  56,  70,  78,  157, 166, 225, 331, 356, 370],
  84: [43,  64,  80,  90,  185, 195, 230, 338, 364, 378],
  96: [51,  74,  93,  104, 216, 227, 270, 402, 432, 448],
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
// Design tokens (matches ICC / CML tool family)
// ---------------------------------------------------------------------------
const C = {
  red:        '#dc2626',
  redDark:    '#991b1b',
  text:       '#1a1a1a',
  muted:      '#737373',
  faint:      '#a3a3a3',
  border:     '#e5e5e5',
  blue:       '#2563eb',
  blueBg:     '#eff6ff',
  blueBorder: '#bfdbfe',
  amber:      '#92400e',
  amberBg:    '#fffbeb',
  amberBorder:'#fcd34d',
  green:      '#047857',
  greenBg:    'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
  greenBorder:'#a7f3d0',
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #171717 0%, #262626 50%, #0a0a0a 100%)',
    padding: '24px 16px 60px',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  wrap: {
    width: '100%',
    maxWidth: 720,
  },
  card: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    borderTop: `4px solid ${C.red}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    padding: '22px 26px',
    marginBottom: 20,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    boxShadow: `0 0 16px rgba(220,38,38,0.45)`,
    flexShrink: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: C.text,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    fontWeight: 500,
    margin: '2px 0 0',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.red,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 18,
    lineHeight: 1.5,
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
    marginBottom: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#404040',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  hint: {
    fontSize: 11,
    color: C.faint,
  },
  warnBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: C.amberBg,
    border: `1px solid ${C.amberBorder}`,
    color: C.amber,
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 13,
    lineHeight: 1.5,
    marginTop: 16,
  },
  resultCard: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    borderTop: `4px solid ${C.red}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fef2f2',
    borderBottom: `1px solid #fecaca`,
    padding: '12px 26px',
  },
  resultHeaderLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.red,
  },
  skidsBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: C.amber,
    background: C.amberBg,
    border: `1px solid ${C.amberBorder}`,
    borderRadius: 999,
    padding: '4px 12px',
  },
  resultBody: {
    padding: '22px 26px',
  },
  metricsGrid: {
    display: 'grid',
    gap: 20,
    marginBottom: 20,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: C.faint,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 800,
    color: C.text,
  },
  metricSub: {
    fontSize: 11,
    color: C.faint,
    marginTop: 3,
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${C.border}`,
    margin: '0 0 20px',
  },
  promptText: {
    fontSize: 13,
    color: C.faint,
  },
  noteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    borderTop: `1px solid ${C.border}`,
    fontSize: 13,
  },
}

function inputStyle(isAuto, focused) {
  return {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    borderRadius: 10,
    border: `1px solid ${focused ? C.red : isAuto ? C.blueBorder : C.border}`,
    background: isAuto ? C.blueBg : '#fafafa',
    color: isAuto ? C.blue : C.text,
    fontWeight: isAuto ? 600 : 400,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: isAuto ? 'default' : 'text',
    transition: 'border-color 0.15s',
  }
}

export default function App() {

  // ---- Skid dimensions + max weight ---------------------------------------
  const [width,  setWidth]  = useState('')
  const [length, setLength] = useState('')
  const [maxWt,  setMaxWt]  = useState('4000')

  // ---- Drop lbs (drives skid count) ---------------------------------------
  const [dropLbs, setDropLbs] = useState('')

  const [focus, setFocus] = useState(null)

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

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        body { margin: 0; }
      `}} />

      <div style={s.page}>
        <div style={s.wrap}>

          {/* ── HEADER CARD ───────────────────────────────────────────── */}
          <div style={s.card}>
            <div style={s.headerRow}>
              <div style={s.iconBadge}>📦</div>
              <div>
                <h1 style={s.title}>Pack Cost Calculator</h1>
                <p style={s.subtitle}>Skid pack cost &amp; per lb quote pricing</p>
              </div>
            </div>
          </div>

          {/* ── SKID SETUP CARD ──────────────────────────────────────── */}
          <div style={s.card}>
            <div style={s.sectionLabel}>Skid Setup</div>
            <div style={s.sectionDesc}>
              The drop/remainder skid size and capacity — determines pack cost per skid and how many skids are needed.
            </div>

            <div style={s.row3}>
              <div style={s.field}>
                <label style={s.label}>Width (in)</label>
                <input
                  type="number" min="0" step="any" placeholder="e.g. 23"
                  value={width}
                  onChange={e => setWidth(e.target.value)}
                  onFocus={() => setFocus('w')}
                  onBlur={() => setFocus(null)}
                  style={inputStyle(false, focus === 'w')}
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
                  style={inputStyle(false, focus === 'l')}
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
                  style={inputStyle(false, focus === 'maxWt')}
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Total Lbs</label>
              <input
                type="number" min="0" step="any" placeholder="e.g. 800"
                value={dropLbs}
                onChange={e => setDropLbs(e.target.value)}
                onFocus={() => setFocus('dropLbs')}
                onBlur={() => setFocus(null)}
                style={inputStyle(false, focus === 'dropLbs')}
              />
              <span style={s.hint}>lbs of material being packed</span>
            </div>

            {/* Multi-skid warning */}
            {multiSkid && (
              <div style={s.warnBanner}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span>
                  <strong>{dropLbsNum.toLocaleString()} lbs</strong> drop ÷ {maxWtNum.toLocaleString()} lbs/skid
                  {' '}= <strong>{skidCount} skids</strong> needed. Pack cost × {skidCount}.
                </span>
              </div>
            )}
          </div>

          {/* ── RESULT CARD ──────────────────────────────────────────── */}
          {result ? (
            <div style={s.resultCard}>
              <div style={s.resultHeader}>
                <span style={s.resultHeaderLabel}>Result</span>
                {multiSkid && (
                  <span style={s.skidsBadge}>{skidCount} skids × ${packPerSkid.toFixed(2)}</span>
                )}
              </div>

              <div style={s.resultBody}>
                <div style={{ ...s.metricsGrid, gridTemplateColumns: multiSkid ? 'repeat(3, 1fr)' : '1fr 1fr' }}>
                  <div>
                    <div style={s.metricLabel}>Pack Cost / Skid</div>
                    <div style={s.metricVal}>${packPerSkid.toFixed(2)}</div>
                  </div>
                  {multiSkid && (
                    <div>
                      <div style={s.metricLabel}>Skids Needed</div>
                      <div style={s.metricVal}>{skidCount}</div>
                      <div style={s.metricSub}>{dropLbsNum.toLocaleString()} drop lbs ÷ {maxWtNum.toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <div style={s.metricLabel}>Total Pack Cost</div>
                    <div style={s.metricVal}>${totalPackCost.toFixed(2)}</div>
                    {multiSkid && <div style={s.metricSub}>${packPerSkid.toFixed(2)} × {skidCount}</div>}
                  </div>
                </div>

                <hr style={s.divider} />

                <div style={{ ...s.noteRow, color: note.exact ? C.green : C.muted }}>
                  <span>{note.exact ? '✓' : '↑'}</span>
                  <span>{note.text}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={s.resultCard}>
              <div style={{ padding: '22px 26px' }}>
                <p style={s.promptText}>Enter drop skid dimensions to begin.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
