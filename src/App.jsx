import { useState } from 'react'

// ---------------------------------------------------------------------------
// Pricing table  (rows = width, cols = length)
// ---------------------------------------------------------------------------
const WIDTHS  = [24, 36, 48, 60, 72, 84, 96]
const LENGTHS = [48, 96, 120, 144, 192, 240, 300, 360, 420, 480]

const TABLE = {
  24: [27,  37,  42,  48,  130, 133, 170, 229, 253, 257],
  36: [35,  51,  59,  67,  139, 143, 186, 247, 277, 287],
  48: [36,  53,  61,  75,  143, 153, 197, 259, 295, 307],
  60: [43,  61,  69,  83,  157, 168, 249, 317, 369, 381],
  72: [44,  70,  80,  97,  186, 198, 279, 324, 387, 401],
  84: [45,  72,  83,  99,  189, 202, 285, 330, 395, 409],
  96: [64,  91,  110, 129, 240, 259, 339, 491, 518, 539],
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

function noteText(result) {
  if (!result) return null
  const { exactW, exactL, usedW, usedL, cappedW, cappedL } = result
  if (exactW && exactL) return { text: `Exact table match: ${usedW}" x ${usedL}".`, exact: true }
  const parts = []
  if (!exactW) parts.push(cappedW ? `width capped at max ${usedW}"` : `width rounded up to ${usedW}"`)
  if (!exactL) parts.push(cappedL ? `length capped at max ${usedL}"` : `length rounded up to ${usedL}"`)
  return { text: `Using table size ${usedW}" x ${usedL}": ${parts.join(', ')}.`, exact: false }
}

// ---------------------------------------------------------------------------
// Alloy data (matches Shipping Dimensions Calculator, ASTM B209 lb/in3)
// ---------------------------------------------------------------------------
const ALLOYS = [
  { label: '1100', density: 0.0975 },
  { label: '2024', density: 0.1010 },
  { label: '3003', density: 0.0980 },
  { label: '3004', density: 0.0980 },
  { label: '3005', density: 0.0980 },
  { label: '3105', density: 0.0980 },
  { label: '5052', density: 0.0968 },
  { label: '5083', density: 0.0961 },
  { label: '5086', density: 0.0962 },
  { label: '5182', density: 0.0968 },
  { label: '6061', density: 0.0975 },
  { label: '6063', density: 0.0975 },
  { label: '7075', density: 0.1020 },
]

const getDensity = alloy => ALLOYS.find(a => a.label === alloy)?.density ?? 0.098

// ---------------------------------------------------------------------------
// Interleave options, priced per square foot of sheet face.
// Two sided options already carry the doubled rate, so square footage stays
// one face per sheet and the rate does the doubling.
// ---------------------------------------------------------------------------
const INTERLEAVE = [
  { key: 'na',     label: 'N/A',           rate: 0.000 },
  { key: 'pi',     label: 'PI',            rate: 0.010 },
  { key: 'pvc',    label: 'PVC',           rate: 0.035 },
  { key: 'bw',     label: 'B/W',           rate: 0.040 },
  { key: 'pvc2',   label: 'PVC 2 Sided',   rate: 0.070 },
  { key: 'laser',  label: 'Laser',         rate: 0.122 },
  { key: 'laser2', label: 'Laser 2 Sided', rate: 0.244 },
]

const getInterleave = key => INTERLEAVE.find(i => i.key === key) || INTERLEAVE[0]

const fmtN = (n, dec = 1) =>
  parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })

// ---------------------------------------------------------------------------
// Coil geometry (ported from Shipping Dimensions Calculator)
// ---------------------------------------------------------------------------
const getSaddleWidth = od => {
  if (od <= 32) return 28
  if (od <= 40) return 34
  if (od <= 48) return 38
  if (od <= 56) return 42
  if (od <= 66) return 46
  if (od <= 76) return 52
  return 58
}

function coilGeom({ alloy, thickness, width, weight, coreId }) {
  const density = getDensity(alloy)
  const t = parseFloat(thickness), w = parseFloat(width)
  const lbs = parseFloat(weight), id = parseFloat(coreId)
  if (!t || !w || !lbs || !id || t <= 0 || w <= 0 || lbs <= 0 || id <= 0) return null
  const volIn3   = lbs / density
  const lengthIn = volIn3 / (t * w)
  const lengthFt = lengthIn / 12
  const od       = Math.sqrt((4 * lengthIn * t) / Math.PI + id * id)
  if (od <= id) return { error: 'Calculated OD is at or below the core ID. Check gauge, width, or weight.' }
  return { density, volIn3, lengthIn, lengthFt, od, w, lbs, id }
}

// How many coils fit on one skid. Auto mode caps on weight AND the dimension
// that grows with each coil: row length when eye to side, stack height when
// eye to sky. The smaller wins.
function coilCount(coilIn, geom) {
  const orient = coilIn.orient === 'sky' ? 'sky' : 'side'
  if (!coilIn.autoCoils) {
    let n = parseInt(coilIn.coilsPerSkid)
    if (!n || n < 1) n = 1
    return { n, orient, limit: 'manual' }
  }
  const w = geom.w, lbs = geom.lbs
  const maxWt = parseFloat(coilIn.maxSkidWt) || 0
  const byWt  = (maxWt > 0 && lbs > 0) ? Math.floor(maxWt / lbs) : 9999
  let byDim = 9999
  const dimName = orient === 'sky' ? 'height' : 'row length'
  if (orient === 'sky') {
    const maxH = parseFloat(coilIn.maxStackH) || 0
    if (maxH > 0 && w > 0) byDim = Math.floor((maxH - 6) / w)
  } else {
    const maxLen = parseFloat(coilIn.maxRowLen) || 0
    if (maxLen > 0 && w > 0) byDim = Math.floor((maxLen - 4) / w)
  }
  const n = Math.max(1, Math.min(byWt, byDim))
  const limit = byWt <= byDim ? 'weight' : dimName
  return { n, orient, limit, byWt, byDim }
}

// Skid footprint for N coils in one orientation.
function coilFootprint(orient, od, coilW, N) {
  const skidH = 6
  if (orient === 'side') {
    return {
      footLen: N * coilW + 4,          // 2" clearance each end
      footWid: getSaddleWidth(od),
      totalH:  od + skidH,
      skidH,
    }
  }
  return {
    footLen: od,
    footWid: od,
    totalH:  N * coilW + skidH,
    skidH,
  }
}

// ---------------------------------------------------------------------------
// Extrusion profile geometry (ported from Shipping Dimensions Calculator)
// Each shape derives a metal cross section area (in2) and a per piece outer
// bounding box (pieceW x pieceH). Weight per ft is area x density x 12.
// ---------------------------------------------------------------------------
const EXT_SHAPES = [
  { key: 'round_bar',   label: 'Round Bar',         fields: [['d', 'Dia"']] },
  { key: 'square_bar',  label: 'Square Bar',        fields: [['s', 'Side"']] },
  { key: 'rect_bar',    label: 'Rectangle / Flat',  fields: [['w', 'Width"'], ['h', 'Height"']] },
  { key: 'round_tube',  label: 'Round Tube / Pipe', fields: [['od', 'OD"'], ['wall', 'Wall"']] },
  { key: 'square_tube', label: 'Square Tube',       fields: [['s', 'Side"'], ['wall', 'Wall"']] },
  { key: 'rect_tube',   label: 'Rectangle Tube',    fields: [['w', 'Width"'], ['h', 'Height"'], ['wall', 'Wall"']] },
  { key: 'angle',       label: 'Angle (L)',         fields: [['a', 'Leg A"'], ['b', 'Leg B"'], ['t', 'Thick"']] },
  { key: 'channel',     label: 'Channel (C)',       fields: [['cd', 'Depth"'], ['cf', 'Flange"'], ['ct', 'Thick"']] },
  { key: 'custom',      label: 'Custom / Other',    fields: [['lbPerFt', 'Wt/ft'], ['pieceW', 'Piece W"'], ['pieceH', 'Piece H"']] },
]

const getShapeCfg = key => EXT_SHAPES.find(s => s.key === key) || EXT_SHAPES[0]

const extProfile = (st, density) => {
  const num = k => parseFloat(st[k])
  let area = 0, pieceW = 0, pieceH = 0, lbPerFt = 0, dimsLabel = ''
  switch (st.shape) {
    case 'round_bar': {
      const d = num('d')
      if (!d || d <= 0) return null
      area = Math.PI / 4 * d * d; pieceW = d; pieceH = d
      dimsLabel = `${d}" dia`
      break
    }
    case 'square_bar': {
      const sd = num('s')
      if (!sd || sd <= 0) return null
      area = sd * sd; pieceW = sd; pieceH = sd
      dimsLabel = `${sd}" sq`
      break
    }
    case 'rect_bar': {
      const w = num('w'), h = num('h')
      if (!w || !h || w <= 0 || h <= 0) return null
      area = w * h; pieceW = w; pieceH = h
      dimsLabel = `${w}" x ${h}"`
      break
    }
    case 'round_tube': {
      const od = num('od'), wall = num('wall')
      if (!od || !wall || od <= 0 || wall <= 0 || od <= 2 * wall) return null
      const id = od - 2 * wall
      area = Math.PI / 4 * (od * od - id * id); pieceW = od; pieceH = od
      dimsLabel = `${od}" OD x ${wall}" wall`
      break
    }
    case 'square_tube': {
      const sd = num('s'), wall = num('wall')
      if (!sd || !wall || sd <= 0 || wall <= 0 || sd <= 2 * wall) return null
      const inner = sd - 2 * wall
      area = sd * sd - inner * inner; pieceW = sd; pieceH = sd
      dimsLabel = `${sd}" sq x ${wall}" wall`
      break
    }
    case 'rect_tube': {
      const w = num('w'), h = num('h'), wall = num('wall')
      if (!w || !h || !wall || w <= 0 || h <= 0 || wall <= 0 || w <= 2 * wall || h <= 2 * wall) return null
      area = w * h - (w - 2 * wall) * (h - 2 * wall); pieceW = w; pieceH = h
      dimsLabel = `${w}" x ${h}" x ${wall}" wall`
      break
    }
    case 'angle': {
      const a = num('a'), b = num('b'), t = num('t')
      if (!a || !b || !t || a <= 0 || b <= 0 || t <= 0 || t >= a || t >= b) return null
      area = t * (a + b - t); pieceW = b; pieceH = a
      dimsLabel = `${a}" x ${b}" x ${t}"`
      break
    }
    case 'channel': {
      const cd = num('cd'), cf = num('cf'), ct = num('ct')
      if (!cd || !cf || !ct || cd <= 0 || cf <= 0 || ct <= 0 || ct >= cf || 2 * ct >= cd) return null
      area = ct * (cd + 2 * (cf - ct)); pieceW = cf; pieceH = cd
      dimsLabel = `${cd}" deep x ${cf}" flange x ${ct}"`
      break
    }
    case 'custom': {
      const lpf = num('lbPerFt'), pw = num('pieceW'), ph = num('pieceH')
      if (!lpf || !pw || !ph || lpf <= 0 || pw <= 0 || ph <= 0) return null
      lbPerFt = lpf; pieceW = pw; pieceH = ph
      area = lpf / (density * 12)
      dimsLabel = `${lpf} lb/ft, ${pw}" x ${ph}"`
      return { area, lbPerFt, pieceW, pieceH, dimsLabel }
    }
    default:
      return null
  }
  lbPerFt = area * density * 12
  return { area, lbPerFt, pieceW, pieceH, dimsLabel }
}

// Tight pack N identical pieces into a near square cross section.
const packBundle = (pieceW, pieceH, N) => {
  if (N <= 1) return { perRow: 1, rows: 1, bundleW: pieceW, bundleH: pieceH }
  const targetSide = Math.sqrt(N * pieceW * pieceH)
  let perRow = Math.max(1, Math.round(targetSide / pieceW))
  perRow = Math.min(perRow, N)
  const rows = Math.ceil(N / perRow)
  return { perRow, rows, bundleW: perRow * pieceW, bundleH: rows * pieceH }
}

// Length in FEET or null. unit is "in" or "ft".
const getLenFt = st => {
  const v = parseFloat(st.length)
  if (!v || v <= 0) return null
  return st.lengthUnit === 'ft' ? v : v / 12
}

const computeExtWtPerPc = st => {
  const prof = extProfile(st, getDensity(st.alloy))
  const Lft = getLenFt(st)
  if (!prof || !Lft) return null
  return prof.lbPerFt * Lft
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
  redBg:      '#fef2f2',
  redBorder:  '#fecaca',
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
  wrap: { width: '100%', maxWidth: 780 },
  card: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    borderTop: `4px solid ${C.red}`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    padding: '22px 26px',
    marginBottom: 20,
  },
  headerRow: { display: 'flex', alignItems: 'center', gap: 16 },
  iconBadge: {
    width: 48, height: 48, borderRadius: 12,
    background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, boxShadow: '0 0 16px rgba(220,38,38,0.45)', flexShrink: 0,
  },
  title: { fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.01em', margin: 0 },
  subtitle: { fontSize: 13, color: C.muted, fontWeight: 500, margin: '2px 0 0' },
  tabBar: { display: 'flex', gap: 4, marginTop: 20, borderBottom: `1px solid ${C.border}` },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: C.red, marginBottom: 4,
  },
  sectionDesc: { fontSize: 13, color: C.muted, marginBottom: 18, lineHeight: 1.5 },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#404040', display: 'flex', alignItems: 'center', gap: 6 },
  hint: { fontSize: 11, color: C.faint },
  segWrap: {
    display: 'inline-flex', padding: 3, background: '#f5f5f5',
    border: `1px solid ${C.border}`, borderRadius: 10, gap: 3,
  },
  readout: {
    display: 'flex', flexWrap: 'wrap', gap: '4px 20px',
    background: C.blueBg, border: `1px solid ${C.blueBorder}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 12, color: C.blue,
    marginBottom: 16,
  },
  warnBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amber,
    borderRadius: 10, padding: '12px 16px', fontSize: 13, lineHeight: 1.5, marginTop: 16,
  },
  infoBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue,
    borderRadius: 10, padding: '12px 16px', fontSize: 13, lineHeight: 1.5, marginTop: 16,
  },
  errBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.redDark,
    borderRadius: 10, padding: '12px 16px', fontSize: 13, lineHeight: 1.5, marginTop: 16,
  },
  resultCard: {
    background: 'rgba(255,255,255,0.97)', borderRadius: 16,
    borderTop: `4px solid ${C.red}`, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden',
  },
  resultHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 26px',
  },
  resultHeaderLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: C.red,
  },
  skidsBadge: {
    fontSize: 12, fontWeight: 700, color: C.amber, background: C.amberBg,
    border: `1px solid ${C.amberBorder}`, borderRadius: 999, padding: '4px 12px',
  },
  resultBody: { padding: '22px 26px' },
  metricsGrid: { display: 'grid', gap: 20, marginBottom: 20 },
  metricLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: C.faint, marginBottom: 4,
  },
  metricVal: { fontSize: 24, fontWeight: 800, color: C.text },
  metricSub: { fontSize: 11, color: C.faint, marginTop: 3 },
  divider: { border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 20px' },
  promptText: { fontSize: 13, color: C.faint },
  noteRow: {
    display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14,
    borderTop: `1px solid ${C.border}`, fontSize: 13,
  },
  summaryBar: {
    marginTop: 16, background: 'linear-gradient(90deg, #171717, #262626)',
    color: '#fff', borderRadius: 12, padding: '14px 18px',
    fontSize: 12.5, fontWeight: 600, lineHeight: 1.6,
  },
}

function inputStyle(isAuto, focused) {
  return {
    width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 10,
    border: `1px solid ${focused ? C.red : isAuto ? C.blueBorder : C.border}`,
    background: isAuto ? C.blueBg : '#fafafa',
    color: isAuto ? C.blue : C.text,
    fontWeight: isAuto ? 600 : 400,
    outline: 'none', boxSizing: 'border-box',
    cursor: isAuto ? 'default' : 'text', transition: 'border-color 0.15s',
  }
}

function selectStyle(focused) {
  return {
    width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 10,
    border: `1px solid ${focused ? C.red : C.border}`,
    background: '#fafafa', color: C.text, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer',
  }
}

function tabStyle(active) {
  return {
    padding: '10px 16px', fontSize: 13, fontWeight: 700, border: 'none',
    background: 'transparent', color: active ? C.red : C.muted,
    borderBottom: `3px solid ${active ? C.red : 'transparent'}`,
    marginBottom: -1, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s',
  }
}

function segStyle(active) {
  return {
    padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 7,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    background: active ? '#fff' : 'transparent',
    color: active ? C.red : C.muted,
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
  }
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------
function Seg({ options, value, onChange }) {
  return (
    <div style={s.segWrap}>
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} style={segStyle(value === o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NumField({ label, hint, value, onChange, placeholder, id, focus, setFocus, readOnly, step }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input
        type="number" min="0" step={step || 'any'} placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(id)}
        onBlur={() => setFocus(null)}
        readOnly={readOnly}
        style={inputStyle(!!readOnly, focus === id)}
      />
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
  )
}

function SelField({ label, hint, value, onChange, options, id, focus, setFocus }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(id)} onBlur={() => setFocus(null)}
        style={selectStyle(focus === id)}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
  )
}

function ResultPanel({ result, count, perUnit, total, countLabel, metrics, badgeText, summary, addOn, grandTotal }) {
  const multi = count > 1
  const note = noteText(result)
  const shown = [
    { label: 'Pack Cost / Skid', value: `$${perUnit.toFixed(2)}`, sub: `${result.usedW}" x ${result.usedL}" table size` },
    ...(multi ? [{ label: countLabel, value: String(count), sub: metrics?.countSub }] : []),
    ...(metrics?.extra ? [metrics.extra] : []),
    { label: 'Total Pack Cost', value: `$${total.toFixed(2)}`, sub: multi ? `$${perUnit.toFixed(2)} x ${count}` : null },
    ...(addOn ? [addOn] : []),
    ...(grandTotal != null
      ? [{ label: 'Total Cost', value: `$${grandTotal.toFixed(2)}`, sub: 'pack plus interleave' }]
      : []),
  ]

  return (
    <div style={s.resultCard}>
      <div style={s.resultHeader}>
        <span style={s.resultHeaderLabel}>Result</span>
        {multi && <span style={s.skidsBadge}>{badgeText}</span>}
      </div>

      <div style={s.resultBody}>
        <div style={{ ...s.metricsGrid, gridTemplateColumns: `repeat(${Math.min(shown.length, 3)}, 1fr)` }}>
          {shown.map((m, i) => (
            <div key={i}>
              <div style={s.metricLabel}>{m.label}</div>
              <div style={s.metricVal}>{m.value}</div>
              {m.sub && <div style={s.metricSub}>{m.sub}</div>}
            </div>
          ))}
        </div>

        <hr style={s.divider} />

        <div style={{ ...s.noteRow, color: note.exact ? C.green : C.muted }}>
          <span>{note.exact ? '\u2713' : '\u2191'}</span>
          <span>{note.text}</span>
        </div>

        {summary && <div style={s.summaryBar}>{summary}</div>}
      </div>
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <div style={s.resultCard}>
      <div style={{ padding: '22px 26px' }}>
        <p style={s.promptText}>{text}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TAB 1: Manual skid (original behavior, direct dimension entry)
// ---------------------------------------------------------------------------
function ManualTab() {
  const [width,  setWidth]  = useState('')
  const [length, setLength] = useState('')
  const [maxWt,  setMaxWt]  = useState('4000')
  const [dropLbs, setDropLbs] = useState('')
  const [focus, setFocus] = useState(null)

  // Interleave state. Defaults to N/A so the card is a no cost pass through.
  const [ilType,   setIlType]   = useState('na')
  const [ilMode,   setIlMode]   = useState('auto')
  const [ilAlloy,  setIlAlloy]  = useState('5052')
  const [ilGauge,  setIlGauge]  = useState('')
  const [ilSheets, setIlSheets] = useState('')

  const dropLbsNum = parseFloat(dropLbs) || 0
  const maxWtNum   = parseFloat(maxWt)   || 0
  const skidCount  = maxWtNum > 0 && dropLbsNum > 0 ? Math.ceil(dropLbsNum / maxWtNum) : 1
  const multiSkid  = skidCount > 1

  const w   = parseFloat(width)
  const len = parseFloat(length)
  const result        = (w > 0 && len > 0) ? getPrice(w, len) : null
  const packPerSkid   = result ? result.price : 0
  const totalPackCost = packPerSkid * skidCount

  // Interleave math. Square footage is the actual entered sheet size, not the
  // rounded up table size, so the cost tracks real material area.
  const il         = getInterleave(ilType)
  const ilOn       = il.rate > 0
  const sheetSqFt  = (w > 0 && len > 0) ? (w * len) / 144 : 0
  const ilDensity  = getDensity(ilAlloy)
  const gaugeNum   = parseFloat(ilGauge) || 0
  const sheetWt    = (w > 0 && len > 0 && gaugeNum > 0) ? w * len * gaugeNum * ilDensity : 0
  const autoSheets = (sheetWt > 0 && dropLbsNum > 0) ? Math.max(1, Math.round(dropLbsNum / sheetWt)) : 0
  const sheetCount = ilMode === 'manual' ? (parseInt(ilSheets) || 0) : autoSheets
  const ilSqFt     = sheetSqFt * sheetCount
  const ilCost     = ilSqFt * il.rate
  const ilReady    = ilOn && sheetCount > 0 && sheetSqFt > 0
  const ilPerSkid  = ilReady && skidCount > 0 ? ilCost / skidCount : 0
  const grandTotal = totalPackCost + (ilReady ? ilCost : 0)

  return (
    <>
      <div style={s.card}>
        <div style={s.sectionLabel}>Skid Setup</div>
        <div style={s.sectionDesc}>
          Direct dimension entry for drop/remainder skids, sheet, or plate. Determines pack cost per skid and how many
          skids are needed.
        </div>

        <div style={s.row3}>
          <NumField label="Width (in)" hint="table range: 24 to 96" placeholder="e.g. 23"
            value={width} onChange={setWidth} id="w" focus={focus} setFocus={setFocus} />
          <NumField label="Length (in)" hint="table range: 48 to 480" placeholder="e.g. 131.52"
            value={length} onChange={setLength} id="l" focus={focus} setFocus={setFocus} />
          <NumField label="Max Wt / Skid (lbs)" placeholder="4000"
            value={maxWt} onChange={setMaxWt} id="maxWt" focus={focus} setFocus={setFocus} />
        </div>

        <NumField label="Total Lbs" hint="lbs of material being packed" placeholder="e.g. 800"
          value={dropLbs} onChange={setDropLbs} id="dropLbs" focus={focus} setFocus={setFocus} />

        {multiSkid && (
          <div style={s.warnBanner}>
            <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
            <span>
              <strong>{dropLbsNum.toLocaleString()} lbs</strong> total {'\u00F7'} {maxWtNum.toLocaleString()} lbs/skid
              {' '}= <strong>{skidCount} skids</strong> needed. Pack cost x {skidCount}.
            </span>
          </div>
        )}
      </div>

      {/* INTERLEAVE */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Interleave</div>
        <div style={s.sectionDesc}>
          Optional sheet protection priced per square foot of sheet face, using the same width, length, and total lbs
          entered above. Defaults to N/A. The two sided options already carry the doubled rate, so square footage stays
          one face per sheet.
        </div>

        <div style={s.row2}>
          <SelField label="Interleave Type" value={ilType} onChange={setIlType} id="ilType"
            focus={focus} setFocus={setFocus}
            options={INTERLEAVE.map(i => ({ value: i.key, label: `${i.label}  ($${i.rate.toFixed(3)}/sqft)` }))} />
          <NumField label="Rate ($/sqft)" hint="from selection" readOnly
            value={il.rate.toFixed(3)} onChange={() => {}} id="ilRate" focus={focus} setFocus={setFocus} />
        </div>

        {ilOn && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...s.label, marginBottom: 8 }}>Sheet Count</label>
              <Seg
                options={[
                  { value: 'auto',   label: 'Auto from lbs' },
                  { value: 'manual', label: 'Enter sheets' },
                ]}
                value={ilMode}
                onChange={setIlMode}
              />
              <div style={{ ...s.hint, marginTop: 6 }}>
                {ilMode === 'auto'
                  ? 'Sheets derived from total lbs, sheet size, gauge, and alloy density.'
                  : 'Sheet count entered directly. Gauge and alloy are not used.'}
              </div>
            </div>

            <div style={s.row3}>
              {ilMode === 'auto' ? (
                <>
                  <SelField label="Alloy" hint="sets density" value={ilAlloy} onChange={setIlAlloy} id="ilAlloy"
                    focus={focus} setFocus={setFocus}
                    options={ALLOYS.map(a => ({ value: a.label, label: a.label }))} />
                  <NumField label="Gauge (in)" step="0.001" placeholder="0.063"
                    hint={sheetWt > 0 ? `${fmtN(sheetWt, 1)} lbs/sheet` : 'thickness per sheet'}
                    value={ilGauge} onChange={setIlGauge} id="ilGauge" focus={focus} setFocus={setFocus} />
                  <NumField label="Sheets" hint="calculated" readOnly
                    value={sheetCount || ''} onChange={() => {}} id="ilSheetCalc"
                    focus={focus} setFocus={setFocus} />
                </>
              ) : (
                <>
                  <NumField label="Sheets" step="1" placeholder="e.g. 40"
                    value={ilSheets} onChange={setIlSheets} id="ilSheetMan" focus={focus} setFocus={setFocus} />
                  <NumField label="Sq Ft / Sheet" hint="calculated" readOnly
                    value={sheetSqFt ? sheetSqFt.toFixed(2) : ''} onChange={() => {}} id="ilSqPer"
                    focus={focus} setFocus={setFocus} />
                  <NumField label="Total Sq Ft" hint="calculated" readOnly
                    value={ilSqFt ? ilSqFt.toFixed(1) : ''} onChange={() => {}} id="ilSqTot"
                    focus={focus} setFocus={setFocus} />
                </>
              )}
            </div>

            {ilReady ? (
              <div style={s.readout}>
                <span><strong>Sq ft / sheet:</strong> {fmtN(sheetSqFt, 2)}</span>
                <span><strong>Sheets:</strong> {sheetCount.toLocaleString()}</span>
                <span><strong>Total sq ft:</strong> {fmtN(ilSqFt, 1)}</span>
                <span><strong>{il.label} cost:</strong> ${ilCost.toFixed(2)}</span>
                {multiSkid && <span><strong>Per skid:</strong> ${ilPerSkid.toFixed(2)}</span>}
              </div>
            ) : (
              <div style={s.warnBanner}>
                <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
                <span>
                  {ilMode === 'auto'
                    ? 'Enter width, length, total lbs, and gauge to derive the sheet count.'
                    : 'Enter width, length, and a sheet count to price the interleave.'}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {result ? (
        <ResultPanel
          result={result}
          count={skidCount}
          perUnit={packPerSkid}
          total={totalPackCost}
          countLabel="Skids Needed"
          badgeText={`${skidCount} skids x $${packPerSkid.toFixed(2)}`}
          metrics={multiSkid ? {
            countSub: `${dropLbsNum.toLocaleString()} lbs ${'\u00F7'} ${maxWtNum.toLocaleString()}`,
            extra: {
              label: 'Lbs / Skid',
              value: Math.ceil(dropLbsNum / skidCount).toLocaleString(),
              sub: `${dropLbsNum.toLocaleString()} lbs across ${skidCount}`,
            },
          } : null}
          addOn={ilReady ? {
            label: `Interleave (${il.label})`,
            value: `$${ilCost.toFixed(2)}`,
            sub: `${fmtN(ilSqFt, 1)} sq ft at $${il.rate.toFixed(3)}`,
          } : null}
          grandTotal={ilReady ? grandTotal : null}
          summary={ilReady ? (
            <>
              {fmtN(w, 2)}" W x {fmtN(len, 2)}" L
              {' | '}{dropLbsNum.toLocaleString()} lbs on {skidCount} skid{skidCount === 1 ? '' : 's'}
              {' | '}Pack ${totalPackCost.toFixed(2)}
              {' | '}{il.label}: {sheetCount.toLocaleString()} sheets, {fmtN(ilSqFt, 1)} sq ft at $
              {il.rate.toFixed(3)} = ${ilCost.toFixed(2)}
              {' | '}Total{' = '}<span style={{ color: '#fca5a5' }}>${grandTotal.toFixed(2)}</span>
            </>
          ) : null}
        />
      ) : (
        <EmptyPanel text="Enter skid dimensions to begin." />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// TAB 2: Coil pack
// ---------------------------------------------------------------------------
const COIL_INIT = {
  alloy: '5052', thickness: '', width: '', weight: '', coreId: '20',
  qty: '', orient: 'side',
  autoCoils: 'auto', coilsPerSkid: '1',
  maxSkidWt: '5000', maxStackH: '72', maxRowLen: '96',
}

function CoilTab() {
  const [coil, setCoil] = useState(COIL_INIT)
  const [focus, setFocus] = useState(null)
  const up = key => val => setCoil(p => ({ ...p, [key]: val }))

  // Interleave state. Defaults to N/A so the card is a no cost pass through.
  const [ilType,    setIlType]    = useState('na')
  const [ilMode,    setIlMode]    = useState('auto')
  const [ilSqFtMan, setIlSqFtMan] = useState('')

  const density = getDensity(coil.alloy)
  const geom    = coilGeom(coil)
  const geomOk  = geom && !geom.error

  const isAuto  = coil.autoCoils === 'auto'
  const cc      = geomOk ? coilCount({ ...coil, autoCoils: isAuto }, geom) : null
  const capPer  = cc ? cc.n : 1

  const qty       = parseInt(coil.qty) || 0
  const skids     = qty > 0 ? Math.max(1, Math.ceil(qty / capPer)) : 1
  const perSkid   = qty > 0 ? Math.ceil(qty / skids) : capPer
  const multi     = skids > 1
  const totalLbs  = geomOk ? geom.lbs * qty : 0

  const fp = geomOk ? coilFootprint(coil.orient, geom.od, geom.w, perSkid) : null

  // Table axes: eye to side prices the saddle width against the row length.
  // Eye to sky prices the OD footprint on both axes.
  const tblW = fp ? fp.footWid : 0
  const tblL = fp ? fp.footLen : 0

  const result    = (tblW > 0 && tblL > 0) ? getPrice(tblW, tblL) : null
  const perPack   = result ? result.price : 0
  const totalCost = perPack * skids

  // Interleave math. Coil face area is the running length times the coil width,
  // so square footage comes straight from the geometry already calculated.
  const il          = getInterleave(ilType)
  const ilOn        = il.rate > 0
  const sqFtPerCoil = geomOk ? geom.lengthFt * (geom.w / 12) : 0
  const autoSqFt    = qty > 0 ? sqFtPerCoil * qty : 0
  const ilSqFt      = ilMode === 'manual' ? (parseFloat(ilSqFtMan) || 0) : autoSqFt
  const ilCost      = ilSqFt * il.rate
  const ilReady     = ilOn && ilSqFt > 0
  const ilPerSkid   = ilReady && skids > 0 ? ilCost / skids : 0
  const ilPerCoil   = ilReady && qty > 0 ? ilCost / qty : 0
  const grandTotal  = totalCost + (ilReady ? ilCost : 0)

  const orientLbl = coil.orient === 'sky' ? 'eye to sky, stacked flat' : 'eye to side, in saddle'
  const tallStack = fp && fp.totalH > 96

  return (
    <>
      {/* COIL SPEC */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Coil Spec</div>
        <div style={s.sectionDesc}>
          Same coil geometry as the Shipping Dimensions Calculator. OD is calculated from gauge, width, weight, and core
          ID, then the skid footprint is matched to the closest pack table size.
        </div>

        <div style={s.row3}>
          <SelField label="Alloy" value={coil.alloy} onChange={up('alloy')} id="cAlloy"
            focus={focus} setFocus={setFocus}
            options={ALLOYS.map(a => ({ value: a.label, label: a.label }))} />
          <NumField label="Density" hint="lb/in3, from alloy" readOnly
            value={density} onChange={() => {}} id="cDens" focus={focus} setFocus={setFocus} />
          <SelField label='Core I.D. (in)' value={coil.coreId} onChange={up('coreId')} id="cCore"
            focus={focus} setFocus={setFocus}
            options={[{ value: '16', label: '16"' }, { value: '20', label: '20"' }, { value: '24', label: '24"' }]} />
        </div>

        <div style={s.row3}>
          <NumField label="Thickness (in)" step="0.001" placeholder="0.032"
            value={coil.thickness} onChange={up('thickness')} id="cThk" focus={focus} setFocus={setFocus} />
          <NumField label="Coil Width (in)" step="0.1" placeholder="48"
            value={coil.width} onChange={up('width')} id="cW" focus={focus} setFocus={setFocus} />
          <NumField label="Weight (lbs/coil)" step="1" placeholder="6076"
            value={coil.weight} onChange={up('weight')} id="cWt" focus={focus} setFocus={setFocus} />
        </div>

        {geom?.error && (
          <div style={s.errBanner}>
            <span style={{ fontSize: 16 }}>{'\u26D4'}</span>
            <span>{geom.error}</span>
          </div>
        )}

        {geomOk && (
          <div style={s.readout}>
            <span><strong>OD:</strong> {fmtN(geom.od, 2)}"</span>
            <span><strong>Coil length:</strong> {Math.round(geom.lengthFt).toLocaleString()} ft</span>
            <span><strong>Saddle:</strong> {getSaddleWidth(geom.od)}"</span>
            <span><strong>Volume:</strong> {Math.round(geom.volIn3).toLocaleString()} in3</span>
          </div>
        )}

        <div style={s.row2}>
          <NumField label="Total Coils on Order" hint="pieces being packed" placeholder="e.g. 6"
            value={coil.qty} onChange={up('qty')} id="cQty" focus={focus} setFocus={setFocus} />
          <NumField label="Total Weight (lbs)" hint="calculated" readOnly
            value={totalLbs ? totalLbs.toFixed(0) : ''} onChange={() => {}} id="cTot"
            focus={focus} setFocus={setFocus} />
        </div>
      </div>

      {/* SKID SETUP */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Skid Setup</div>
        <div style={s.sectionDesc}>
          Orientation sets which dimension grows with each coil. Eye to side lines coils up in a saddle, so the row
          length grows. Eye to sky stacks them flat, so the height grows.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16 }}>
          <div>
            <label style={{ ...s.label, marginBottom: 8 }}>Orientation</label>
            <Seg
              options={[
                { value: 'side', label: 'Eye to side' },
                { value: 'sky',  label: 'Eye to sky' },
              ]}
              value={coil.orient}
              onChange={up('orient')}
            />
          </div>
          <div>
            <label style={{ ...s.label, marginBottom: 8 }}>Coils / Skid</label>
            <Seg
              options={[
                { value: 'auto',   label: 'Auto fit' },
                { value: 'manual', label: 'Manual' },
              ]}
              value={coil.autoCoils}
              onChange={up('autoCoils')}
            />
          </div>
        </div>

        <div style={s.row3}>
          {isAuto ? (
            <NumField label="Max Skid Wt (lbs)" step="100" placeholder="5000"
              value={coil.maxSkidWt} onChange={up('maxSkidWt')} id="cMaxWt" focus={focus} setFocus={setFocus} />
          ) : (
            <NumField label="Coils / Skid" step="1" placeholder="1"
              value={coil.coilsPerSkid} onChange={up('coilsPerSkid')} id="cPer" focus={focus} setFocus={setFocus} />
          )}

          {isAuto && (coil.orient === 'sky' ? (
            <NumField label="Max Stack Ht (in)" step="1" placeholder="72"
              value={coil.maxStackH} onChange={up('maxStackH')} id="cMaxH" focus={focus} setFocus={setFocus} />
          ) : (
            <NumField label="Max Row Len (in)" step="1" placeholder="96"
              value={coil.maxRowLen} onChange={up('maxRowLen')} id="cMaxL" focus={focus} setFocus={setFocus} />
          ))}

          <NumField label="Coils / Skid" hint={isAuto ? 'auto fit' : 'as entered'} readOnly
            value={perSkid || ''} onChange={() => {}} id="cPerCalc" focus={focus} setFocus={setFocus} />
        </div>

        {fp && (
          <div style={s.row3}>
            <NumField label="Skid Width (in)" hint={coil.orient === 'side' ? 'saddle, scales to OD' : 'coil OD'} readOnly
              value={fmtN(fp.footWid, 1)} onChange={() => {}} id="fpW" focus={focus} setFocus={setFocus} />
            <NumField label="Skid Length (in)"
              hint={coil.orient === 'side' ? 'coils x width + 4"' : 'coil OD'} readOnly
              value={fmtN(fp.footLen, 1)} onChange={() => {}} id="fpL" focus={focus} setFocus={setFocus} />
            <NumField label="Total Height (in)" hint="floor to top, incl. 6 in skid" readOnly
              value={fmtN(fp.totalH, 1)} onChange={() => {}} id="fpH" focus={focus} setFocus={setFocus} />
          </div>
        )}

        {geomOk && isAuto && cc && (
          <div style={s.readout}>
            <span>
              <strong>Auto fit:</strong> {cc.n} coil{cc.n === 1 ? '' : 's'} per skid, limited by {cc.limit}
            </span>
            <span><strong>Per skid wt:</strong> {fmtN(geom.lbs * perSkid, 0)} lbs</span>
          </div>
        )}

        {multi && (
          <div style={s.warnBanner}>
            <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
            <span>
              <strong>{qty} coils</strong> at {capPer} per skid = <strong>{skids} skids</strong> needed.
              Pack cost x {skids}.
            </span>
          </div>
        )}

        {tallStack && (
          <div style={s.infoBanner}>
            <span style={{ fontSize: 16 }}>{'\u2139\uFE0F'}</span>
            <span>
              Stack height {fmtN(fp.totalH, 1)}" is over 96". Verify dock clearance and freight before quoting.
            </span>
          </div>
        )}
      </div>

      {/* INTERLEAVE */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Interleave</div>
        <div style={s.sectionDesc}>
          Optional coil surface protection priced per square foot, using the coil geometry already calculated above.
          Face area is running length times coil width. Defaults to N/A. The two sided options already carry the
          doubled rate, so square footage stays one face per coil.
        </div>

        <div style={s.row2}>
          <SelField label="Interleave Type" value={ilType} onChange={setIlType} id="cIlType"
            focus={focus} setFocus={setFocus}
            options={INTERLEAVE.map(i => ({ value: i.key, label: `${i.label}  ($${i.rate.toFixed(3)}/sqft)` }))} />
          <NumField label="Rate ($/sqft)" hint="from selection" readOnly
            value={il.rate.toFixed(3)} onChange={() => {}} id="cIlRate" focus={focus} setFocus={setFocus} />
        </div>

        {ilOn && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...s.label, marginBottom: 8 }}>Square Footage</label>
              <Seg
                options={[
                  { value: 'auto',   label: 'Auto from coil' },
                  { value: 'manual', label: 'Enter sq ft' },
                ]}
                value={ilMode}
                onChange={setIlMode}
              />
              <div style={{ ...s.hint, marginTop: 6 }}>
                {ilMode === 'auto'
                  ? 'Coil length times width times the number of coils on the order.'
                  : 'Total square footage entered directly for the whole order.'}
              </div>
            </div>

            <div style={s.row3}>
              {ilMode === 'auto' ? (
                <>
                  <NumField label="Coil Length (ft)" hint="from geometry" readOnly
                    value={geomOk ? geom.lengthFt.toFixed(0) : ''} onChange={() => {}} id="cIlLen"
                    focus={focus} setFocus={setFocus} />
                  <NumField label="Sq Ft / Coil" hint="length x width" readOnly
                    value={sqFtPerCoil ? sqFtPerCoil.toFixed(0) : ''} onChange={() => {}} id="cIlPer"
                    focus={focus} setFocus={setFocus} />
                  <NumField label="Total Sq Ft" hint={qty > 0 ? `${qty} coil${qty === 1 ? '' : 's'}` : 'calculated'} readOnly
                    value={ilSqFt ? ilSqFt.toFixed(0) : ''} onChange={() => {}} id="cIlTot"
                    focus={focus} setFocus={setFocus} />
                </>
              ) : (
                <>
                  <NumField label="Total Sq Ft" step="1" placeholder="e.g. 13600"
                    value={ilSqFtMan} onChange={setIlSqFtMan} id="cIlMan" focus={focus} setFocus={setFocus} />
                  <NumField label="Sq Ft / Coil" hint="auto reference" readOnly
                    value={sqFtPerCoil ? sqFtPerCoil.toFixed(0) : ''} onChange={() => {}} id="cIlPerRef"
                    focus={focus} setFocus={setFocus} />
                  <NumField label="Interleave Cost" hint="sq ft x rate" readOnly
                    value={ilReady ? ilCost.toFixed(2) : ''} onChange={() => {}} id="cIlCostRef"
                    focus={focus} setFocus={setFocus} />
                </>
              )}
            </div>

            {ilReady ? (
              <div style={s.readout}>
                <span><strong>Sq ft / coil:</strong> {fmtN(sqFtPerCoil, 0)}</span>
                <span><strong>Total sq ft:</strong> {fmtN(ilSqFt, 0)}</span>
                <span><strong>{il.label} cost:</strong> ${ilCost.toFixed(2)}</span>
                {qty > 1 && <span><strong>Per coil:</strong> ${ilPerCoil.toFixed(2)}</span>}
                {multi && <span><strong>Per skid:</strong> ${ilPerSkid.toFixed(2)}</span>}
              </div>
            ) : (
              <div style={s.warnBanner}>
                <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
                <span>
                  {ilMode === 'auto'
                    ? 'Enter gauge, width, weight, and coil count so the coil length can be calculated.'
                    : 'Enter the total square footage to price the interleave.'}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {result ? (
        <ResultPanel
          result={result}
          count={skids}
          perUnit={perPack}
          total={totalCost}
          countLabel="Skids Needed"
          badgeText={`${skids} skids x $${perPack.toFixed(2)}`}
          metrics={{
            countSub: `${qty} coils at ${capPer} per skid`,
            extra: {
              label: multi ? 'Lbs / Skid' : 'Order Weight',
              value: multi ? fmtN(geom.lbs * perSkid, 0) : `${fmtN(totalLbs, 0)} lb`,
              sub: multi
                ? `${perSkid} coil${perSkid === 1 ? '' : 's'} per skid`
                : `${qty} coil${qty === 1 ? '' : 's'} at ${fmtN(geom.lbs, 0)} lbs`,
            },
          }}
          addOn={ilReady ? {
            label: `Interleave (${il.label})`,
            value: `$${ilCost.toFixed(2)}`,
            sub: `${fmtN(ilSqFt, 0)} sq ft at $${il.rate.toFixed(3)}`,
          } : null}
          grandTotal={ilReady ? grandTotal : null}
          summary={
            <>
              {coil.alloy} @ {coil.thickness}" x {coil.width}" wide
              {' | '}OD {fmtN(geom.od, 1)}" on {coil.coreId}" core
              {' | '}{qty} coil{qty === 1 ? '' : 's'} ({orientLbl})
              {' | '}Skid: {fmtN(fp.footWid, 1)}" W x {fmtN(fp.footLen, 1)}" L x {fmtN(fp.totalH, 1)}" H
              {' | '}{skids} skid{skids === 1 ? '' : 's'} at ${perPack.toFixed(2)}
              {' = '}<span style={{ color: ilReady ? '#fff' : '#fca5a5' }}>${totalCost.toFixed(2)}</span>
              {ilReady && (
                <>
                  {' | '}{il.label}: {fmtN(ilSqFt, 0)} sq ft at ${il.rate.toFixed(3)} = ${ilCost.toFixed(2)}
                  {' | '}Total{' = '}<span style={{ color: '#fca5a5' }}>${grandTotal.toFixed(2)}</span>
                </>
              )}
            </>
          }
        />
      ) : (
        <EmptyPanel text="Enter gauge, width, weight, and coil count to begin." />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// TAB 3: Extrusion (shape driven, same entry style as Shipping Dimensions)
// ---------------------------------------------------------------------------
const EXT_INIT = {
  alloy: '6063', shape: 'round_bar',
  d: '', s: '', w: '', h: '', od: '', wall: '', a: '', b: '', t: '',
  cd: '', cf: '', ct: '',
  lbPerFt: '', pieceW: '', pieceH: '',
  length: '', lengthUnit: 'ft', qty: '', totalWt: '',
  maxWt: '4000', maxPcs: '',
  widthMode: 'auto', widthOverride: '',
}

function ExtrusionTab() {
  const [ext, setExt] = useState(EXT_INIT)
  const [focus, setFocus] = useState(null)

  // Keep qty and total weight in sync, same pattern as the shipping calc
  const updateExt = (key, val) => {
    setExt(prev => {
      const next = { ...prev, [key]: val }
      const wtPerPc = computeExtWtPerPc(next)
      if (wtPerPc && wtPerPc > 0) {
        if (key === 'qty') {
          const q = parseInt(val)
          next.totalWt = q > 0 ? (q * wtPerPc).toFixed(1) : ''
        } else if (key === 'totalWt') {
          const lbs = parseFloat(val)
          next.qty = lbs > 0 ? String(Math.round(lbs / wtPerPc)) : ''
        } else {
          if (next.qty && parseInt(next.qty) > 0) {
            next.totalWt = (parseInt(next.qty) * wtPerPc).toFixed(1)
          } else if (next.totalWt && parseFloat(next.totalWt) > 0) {
            next.qty = String(Math.round(parseFloat(next.totalWt) / wtPerPc))
          }
        }
      }
      return next
    })
  }

  const setUnit = unit => {
    setExt(prev => {
      if (prev.lengthUnit === unit) return prev
      let nl = prev.length
      const v = parseFloat(prev.length)
      if (v && v > 0) {
        const conv = unit === 'ft' ? v / 12 : v * 12
        nl = String(parseFloat(conv.toFixed(4)))
      }
      return { ...prev, lengthUnit: unit, length: nl }
    })
  }

  const density   = getDensity(ext.alloy)
  const prof      = extProfile(ext, density)
  const shapeCfg  = getShapeCfg(ext.shape)
  const Lft       = getLenFt(ext)
  const lengthIn  = Lft ? Lft * 12 : 0
  const wtPerPc   = (prof && Lft) ? prof.lbPerFt * Lft : 0
  const qty       = parseInt(ext.qty) || 0
  const totalWt   = wtPerPc * qty

  const maxWtNum  = parseFloat(ext.maxWt)  || 0
  const maxPcsNum = parseFloat(ext.maxPcs) || 0

  const pcsByWt   = (maxWtNum > 0 && wtPerPc > 0) ? Math.floor(maxWtNum / wtPerPc) : qty
  const capPcs    = Math.max(1, Math.min(pcsByWt || 1, maxPcsNum > 0 ? maxPcsNum : Infinity))
  const bundles   = qty > 0 ? Math.max(1, Math.ceil(qty / capPcs)) : 1
  const pcsPerBdl = qty > 0 ? Math.ceil(qty / bundles) : 0
  const driver    = (maxPcsNum > 0 && maxPcsNum < pcsByWt) ? 'piece count' : 'weight'
  const multi     = bundles > 1

  const pack      = (prof && pcsPerBdl > 0) ? packBundle(prof.pieceW, prof.pieceH, pcsPerBdl) : null
  const autoW     = pack ? pack.bundleW : 0
  const bundleW   = ext.widthMode === 'manual' ? (parseFloat(ext.widthOverride) || 0) : autoW

  const result    = (bundleW > 0 && lengthIn > 0) ? getPrice(bundleW, lengthIn) : null
  const perBundle = result ? result.price : 0
  const totalCost = perBundle * bundles

  const overLength = lengthIn > 480
  const heavyPiece = wtPerPc > 0 && maxWtNum > 0 && wtPerPc > maxWtNum

  return (
    <>
      {/* PROFILE */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Extrusion Profile</div>
        <div style={s.sectionDesc}>
          Same shape entry as the Shipping Dimensions Calculator. Weight per foot and the piece envelope come from the
          profile, then the bundle cross section is matched to the closest pack table size.
        </div>

        <div style={s.row3}>
          <SelField label="Alloy" value={ext.alloy} onChange={v => updateExt('alloy', v)} id="alloy"
            focus={focus} setFocus={setFocus}
            options={ALLOYS.map(a => ({ value: a.label, label: a.label }))} />
          <NumField label="Density" hint="lb/in3, from alloy" readOnly
            value={density} onChange={() => {}} id="dens" focus={focus} setFocus={setFocus} />
          <SelField label="Shape" value={ext.shape} onChange={v => updateExt('shape', v)} id="shape"
            focus={focus} setFocus={setFocus}
            options={EXT_SHAPES.map(sh => ({ value: sh.key, label: sh.label }))} />
        </div>

        <div style={shapeCfg.fields.length >= 3 ? s.row3 : s.row2}>
          {shapeCfg.fields.map(([k, lbl]) => (
            <NumField
              key={k} label={lbl} step="0.001"
              placeholder={k === 'lbPerFt' ? '0.750' : '0.0'}
              value={ext[k]} onChange={v => updateExt(k, v)}
              id={`f_${k}`} focus={focus} setFocus={setFocus}
            />
          ))}
        </div>

        {prof && (
          <div style={s.readout}>
            <span><strong>Wt/ft:</strong> {prof.lbPerFt.toFixed(3)} lb/ft</span>
            <span><strong>X-sec:</strong> {prof.area.toFixed(3)} in2</span>
            <span><strong>Piece:</strong> {fmtN(prof.pieceW, 2)}" x {fmtN(prof.pieceH, 2)}"</span>
            {wtPerPc > 0 && <span><strong>Wt/pc:</strong> {fmtN(wtPerPc, 2)} lbs</span>}
          </div>
        )}

        <div style={s.row3}>
          <div style={s.field}>
            <label style={s.label}>Length ({ext.lengthUnit})</label>
            <input
              type="number" min="0" step={ext.lengthUnit === 'ft' ? '0.5' : '1'}
              placeholder={ext.lengthUnit === 'ft' ? '20' : '240'}
              value={ext.length}
              onChange={e => updateExt('length', e.target.value)}
              onFocus={() => setFocus('extLen')} onBlur={() => setFocus(null)}
              style={inputStyle(false, focus === 'extLen')}
            />
            <div style={{ marginTop: 2 }}>
              <Seg
                options={[{ value: 'ft', label: 'FT' }, { value: 'in', label: 'IN' }]}
                value={ext.lengthUnit}
                onChange={setUnit}
              />
            </div>
          </div>

          <NumField label="Qty (pcs)" hint="linked to total weight" placeholder="100"
            value={ext.qty} onChange={v => updateExt('qty', v)} id="extQty" focus={focus} setFocus={setFocus} />

          <NumField
            label="Total Weight (lbs)"
            hint={wtPerPc ? `${fmtN(wtPerPc, 2)} lbs/pc` : 'linked to qty'}
            placeholder="e.g. 1500"
            value={ext.totalWt} onChange={v => updateExt('totalWt', v)} id="extWt" focus={focus} setFocus={setFocus}
          />
        </div>
      </div>

      {/* BUNDLE */}
      <div style={s.card}>
        <div style={s.sectionLabel}>Bundle Setup</div>
        <div style={s.sectionDesc}>
          Bundle count comes from the weight cap. The cross section is tight packed near square from the pieces in one
          bundle, and that width drives the pack table.
        </div>

        <div style={s.row3}>
          <NumField label="Max Wt / Bundle (lbs)" placeholder="4000"
            value={ext.maxWt} onChange={v => updateExt('maxWt', v)} id="extMaxWt" focus={focus} setFocus={setFocus} />
          <NumField label="Max Pcs / Bundle" hint="optional banding limit" placeholder="optional"
            value={ext.maxPcs} onChange={v => updateExt('maxPcs', v)} id="extMaxPcs" focus={focus} setFocus={setFocus} />
          <NumField label="Pcs / Bundle" hint="calculated" readOnly
            value={pcsPerBdl || ''} onChange={() => {}} id="pcsBdl" focus={focus} setFocus={setFocus} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...s.label, marginBottom: 8 }}>Bundle Width</label>
          <Seg
            options={[
              { value: 'auto',   label: 'Auto from pack' },
              { value: 'manual', label: 'Enter width' },
            ]}
            value={ext.widthMode}
            onChange={v => updateExt('widthMode', v)}
          />
        </div>

        <div style={s.row3}>
          {ext.widthMode === 'manual' ? (
            <NumField label="Bundle Width (in)" hint="table range: 24 to 96" placeholder="e.g. 42"
              value={ext.widthOverride} onChange={v => updateExt('widthOverride', v)} id="wOver"
              focus={focus} setFocus={setFocus} />
          ) : (
            <NumField label="Bundle Width (in)" hint="calculated" readOnly
              value={autoW ? autoW.toFixed(2) : ''} onChange={() => {}} id="wAuto"
              focus={focus} setFocus={setFocus} />
          )}
          <NumField label="Bundle Height (in)" hint="calculated" readOnly
            value={pack ? pack.bundleH.toFixed(2) : ''} onChange={() => {}} id="hAuto"
            focus={focus} setFocus={setFocus} />
          <NumField label="Length (in)" hint="used for table lookup" readOnly
            value={lengthIn ? lengthIn.toFixed(2) : ''} onChange={() => {}} id="lenIn"
            focus={focus} setFocus={setFocus} />
        </div>

        {pack && (
          <div style={s.readout}>
            <span><strong>Pack:</strong> {pack.perRow} across x {pack.rows} high</span>
            <span><strong>Bundle:</strong> {fmtN(pack.bundleW, 1)}" W x {fmtN(pack.bundleH, 1)}" H</span>
            <span><strong>Bundle wt:</strong> {fmtN(pcsPerBdl * wtPerPc, 0)} lbs</span>
          </div>
        )}

        {heavyPiece && (
          <div style={s.warnBanner}>
            <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
            <span>
              One piece is <strong>{fmtN(wtPerPc, 0)} lbs</strong>, over the {maxWtNum.toLocaleString()} lb cap.
              Bundling at 1 pc each. Raise the cap or verify the profile size.
            </span>
          </div>
        )}

        {multi && !heavyPiece && (
          <div style={s.warnBanner}>
            <span style={{ fontSize: 16 }}>{'\u26A0\uFE0F'}</span>
            <span>
              <strong>{qty.toLocaleString()} pcs</strong> at {fmtN(wtPerPc, 1)} lbs each
              {' '}= <strong>{bundles} bundles</strong>, limited by {driver}. Pack cost x {bundles}.
            </span>
          </div>
        )}

        {overLength && (
          <div style={s.infoBanner}>
            <span style={{ fontSize: 16 }}>{'\u2139\uFE0F'}</span>
            <span>
              {lengthIn.toFixed(0)}" is past the 480" table max. Pricing at the 480" column. Confirm oversize handling
              before quoting.
            </span>
          </div>
        )}
      </div>

      {result ? (
        <ResultPanel
          result={result}
          count={bundles}
          perUnit={perBundle}
          total={totalCost}
          countLabel="Bundles Needed"
          badgeText={`${bundles} bundles x $${perBundle.toFixed(2)}`}
          metrics={{
            countSub: driver === 'weight'
              ? `${fmtN(totalWt, 0)} lbs at ${maxWtNum.toLocaleString()} cap`
              : `${qty.toLocaleString()} pcs at ${maxPcsNum.toLocaleString()} cap`,
            extra: {
              label: multi ? 'Lbs / Bundle' : 'Order Weight',
              value: multi ? fmtN(pcsPerBdl * wtPerPc, 0) : `${fmtN(totalWt, 0)} lb`,
              sub: multi
                ? `${pcsPerBdl} pcs per bundle`
                : `${qty.toLocaleString()} pcs at ${fmtN(Lft || 0, 2)} ft`,
            },
          }}
          summary={
            <>
              {ext.alloy} {shapeCfg.label}{prof ? ` (${prof.dimsLabel})` : ''}
              {' | '}{fmtN(Lft || 0, 1)} ft x {qty.toLocaleString()} pcs
              {' | '}{fmtN(totalWt, 0)} lbs
              {pack ? ` | Bundle: ${fmtN(pack.bundleW, 1)}" W x ${fmtN(pack.bundleH, 1)}" H` : ''}
              {' | '}{bundles} bundle{bundles === 1 ? '' : 's'} at ${perBundle.toFixed(2)}
              {' = '}<span style={{ color: '#fca5a5' }}>${totalCost.toFixed(2)}</span>
            </>
          }
        />
      ) : (
        <EmptyPanel text="Enter the profile size, length, and qty to begin." />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
const TABS = [
  { key: 'manual', label: 'Manual', icon: '\u{1F4E6}', sub: 'Skid pack cost by entered dimensions' },
  { key: 'coil',   label: 'Coil',   icon: '\u{1F300}', sub: 'Coil skid pack cost from gauge, width, and weight' },
  { key: 'ext',    label: 'Extrusion', icon: '\u{1F4CF}', sub: 'Extrusion bundle pack cost by profile and order qty' },
]

export default function App() {
  const [tab, setTab] = useState('manual')
  const active = TABS.find(t => t.key === tab)

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

          <div style={s.card}>
            <div style={s.headerRow}>
              <div style={s.iconBadge}>{active.icon}</div>
              <div>
                <h1 style={s.title}>Pack Cost Calculator</h1>
                <p style={s.subtitle}>{active.sub}</p>
              </div>
            </div>

            <div style={s.tabBar}>
              {TABS.map(t => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'manual' && <ManualTab />}
          {tab === 'coil'   && <CoilTab />}
          {tab === 'ext'    && <ExtrusionTab />}

        </div>
      </div>
    </>
  )
}
