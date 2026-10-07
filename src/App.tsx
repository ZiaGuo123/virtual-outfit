import { useEffect, useState } from 'react'

type Style = '休闲' | '通勤' | '运动' | '街头'
type Occasion = '日常' | '通勤' | '运动' | '约会' | '聚会'
type Garment = { name: string; style: Style; shape: number }
type Outfit = {
  top: number
  bottom: number
  topColor: string
  bottomColor: string
  occasion: Occasion
}

const styles: Style[] = ['休闲', '通勤', '运动', '街头']
const occasions: Occasion[] = ['日常', '通勤', '运动', '约会', '聚会']

const tops: Garment[] = [
  { name: '经典圆领 T 恤', style: '休闲', shape: 0 },
  { name: '宽松针织衫', style: '休闲', shape: 1 },
  { name: '休闲开襟衫', style: '休闲', shape: 2 },
  { name: '利落衬衫', style: '通勤', shape: 3 },
  { name: '修身西装', style: '通勤', shape: 4 },
  { name: '简约高领衫', style: '通勤', shape: 5 },
  { name: '运动卫衣', style: '运动', shape: 6 },
  { name: '训练短袖', style: '运动', shape: 7 },
  { name: '运动拉链衫', style: '运动', shape: 8 },
  { name: '廓形卫衣', style: '街头', shape: 9 },
  { name: '工装外套', style: '街头', shape: 10 },
  { name: '街头棒球衫', style: '街头', shape: 11 },
]

const bottoms: Garment[] = [
  { name: '直筒牛仔裤', style: '休闲', shape: 0 },
  { name: '宽松休闲裤', style: '休闲', shape: 1 },
  { name: '九分棉质裤', style: '休闲', shape: 2 },
  { name: '锥形西裤', style: '通勤', shape: 3 },
  { name: '高腰阔腿裤', style: '通勤', shape: 4 },
  { name: '修身长裤', style: '通勤', shape: 5 },
  { name: '运动束脚裤', style: '运动', shape: 6 },
  { name: '训练短裤', style: '运动', shape: 7 },
  { name: '侧条纹运动裤', style: '运动', shape: 8 },
  { name: '街头阔腿裤', style: '街头', shape: 9 },
  { name: '工装口袋裤', style: '街头', shape: 10 },
  { name: '宽松束脚裤', style: '街头', shape: 11 },
]

const palette = [
  ['奶油白', '#E8E1D4'],
  ['暖沙色', '#C4A98C'],
  ['燕麦色', '#B9AE96'],
  ['炭黑色', '#343A3E'],
  ['雾霾蓝', '#849EAE'],
  ['深海蓝', '#344C67'],
  ['橄榄绿', '#74836D'],
  ['赤陶红', '#B87665'],
  ['柔雾粉', '#CBA5A0'],
  ['薰衣草', '#AAA3BE'],
] as const

const initial: Outfit = {
  top: 0,
  bottom: 0,
  topColor: '#E8E1D4',
  bottomColor: '#344C67',
  occasion: '日常',
}

const occasionFit: Record<Occasion, Record<Style, number>> = {
  日常: { 休闲: 100, 通勤: 75, 运动: 78, 街头: 85 },
  通勤: { 休闲: 62, 通勤: 100, 运动: 28, 街头: 43 },
  运动: { 休闲: 58, 通勤: 25, 运动: 100, 街头: 62 },
  约会: { 休闲: 88, 通勤: 88, 运动: 48, 街头: 75 },
  聚会: { 休闲: 72, 通勤: 80, 运动: 40, 街头: 95 },
}

function load(): Outfit {
  try {
    const saved = JSON.parse(localStorage.getItem('virtual-outfit-v1') || 'null')
    if (
      saved &&
      Number.isInteger(saved.top) && saved.top >= 0 && saved.top < tops.length &&
      Number.isInteger(saved.bottom) && saved.bottom >= 0 && saved.bottom < bottoms.length &&
      /^#[0-9a-f]{6}$/i.test(saved.topColor) &&
      /^#[0-9a-f]{6}$/i.test(saved.bottomColor) &&
      occasions.includes(saved.occasion)
    ) return saved as Outfit
  } catch { /* 忽略不可用的本地存储 */ }
  return initial
}

function colorInfo(hex: string) {
  const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const high = Math.max(...values), low = Math.min(...values)
  const light = (high + low) / 2
  const difference = high - low
  const saturation = difference === 0 ? 0 : difference / (1 - Math.abs(2 * light - 1))
  return { light, saturation }
}

function evaluate(outfit: Outfit) {
  const a = colorInfo(outfit.topColor), b = colorInfo(outfit.bottomColor)
  const gap = Math.abs(a.light - b.light)
  let color = 79
  if (gap > 0.24) color += 13
  if (Math.min(a.saturation, b.saturation) < 0.2) color += 8
  if (a.saturation > 0.42 && b.saturation > 0.42) color -= 18
  if (a.light < 0.27 && b.light < 0.27) color -= 12
  if (gap < 0.1 && !(a.light < 0.27 && b.light < 0.27)) color -= 6
  color = Math.max(0, Math.min(100, color))

  const topStyle = tops[outfit.top].style
  const bottomStyle = bottoms[outfit.bottom].style
  const style = topStyle === bottomStyle ? 100 : 64
  const occasion = Math.round(
    (occasionFit[outfit.occasion][topStyle] + occasionFit[outfit.occasion][bottomStyle]) / 2
  )
  const total = Math.round(color * 0.38 + style * 0.29 + occasion * 0.33)
  return { color, style, occasion, total }
}

function Model({ outfit, small = false }: { outfit: Outfit; small?: boolean }) {
  const top = tops[outfit.top], bottom = bottoms[outfit.bottom]
  const looseTop = [1, 2, 6, 9, 10, 11].includes(top.shape)
  const shortSleeve = [0, 7, 11].includes(top.shape)
  const jacket = [2, 4, 8, 10, 11].includes(top.shape)
  const wide = [1, 4, 9, 10].includes(bottom.shape)
  const end = bottom.shape === 7 ? 360 : bottom.shape === 2 ? 450 : 475
  const outer = wide ? 111 : bottom.shape === 5 ? 124 : 119

  return (
    <svg
      viewBox="0 0 360 540"
      className={small ? 'h-24 w-20' : 'mx-auto h-full max-h-[580px] w-full'}
      role="img"
      aria-label={`虚拟模特穿着${top.name}和${bottom.name}`}
    >
      {!small && <>
        <circle cx="180" cy="255" r="170" fill="#e9e5db" />
        <ellipse cx="180" cy="510" rx="95" ry="11" fill="#d7d1c7" />
      </>}
      <path d="M144 126 L216 126 L235 280 L220 288 L140 288 L125 280Z" fill="#d4af93" />
      <path d="M143 263 H173 L169 486 H142Z M187 263 H217 L218 486 H191Z" fill="#d4af93" />
      <path d="M130 140 L145 146 L128 310 L113 307Z M215 146 L230 140 L247 307 L232 310Z" fill="#d4af93" />
      <path d="M160 95 H200 V132 H160Z" fill="#d4af93" />
      <ellipse cx="180" cy="67" rx="39" ry="49" fill="#d4af93" />
      <path d="M142 68 Q136 15 178 16 Q216 15 219 58 Q210 45 202 39 Q177 58 143 57Z" fill="#383330" />
      <path d="M166 76 h5 M189 76 h5 M176 93 q4 3 8 0" fill="none" stroke="#805f50" strokeWidth="1.6" strokeLinecap="round" />

      <g className="garment">
        <path
          d={`M139 251 Q180 257 221 251 L${360 - outer} ${end} H186 L180 310 L174 ${end} H${outer}Z`}
          fill={outfit.bottomColor}
          stroke="#45413d" strokeOpacity=".35" strokeWidth="2" strokeLinejoin="round"
        />
        <path d="M139 270 Q180 278 221 270 M180 278 V310" fill="none" stroke="#45413d" strokeOpacity=".3" strokeWidth="2" />
        {[6, 11].includes(bottom.shape) && <path d={`M${outer} ${end - 10} H174 M186 ${end - 10} H${360 - outer}`} stroke="#45413d" strokeOpacity=".4" strokeWidth="4" />}
        {bottom.shape === 8 && <path d={`M135 290 L${outer + 7} ${end - 10} M225 290 L${353 - outer} ${end - 10}`} stroke="#fff" strokeOpacity=".7" strokeWidth="5" />}
        {bottom.shape === 10 && <path d="M113 325 h38 v40 h-38z M209 325 h38 v40 h-38z" fill={outfit.bottomColor} stroke="#45413d" strokeOpacity=".4" />}
      </g>

      <g className="garment">
        <path
          d={`M154 116 L132 124 L${looseTop ? 111 : 120} 143
              L${looseTop ? 91 : 105} ${shortSleeve ? 194 : 232}
              L${shortSleeve ? 126 : 123} ${shortSleeve ? 203 : 238}
              L139 184 L138 ${top.shape === 4 ? 282 : 261}
              Q180 ${top.shape === 4 ? 292 : 271} 222 ${top.shape === 4 ? 282 : 261}
              L221 184 L${shortSleeve ? 234 : 237} ${shortSleeve ? 203 : 238}
              L${looseTop ? 269 : 255} ${shortSleeve ? 194 : 232}
              L${looseTop ? 249 : 240} 143 L228 124 L206 116
              Q180 134 154 116Z`}
          fill={outfit.topColor}
          stroke="#45413d" strokeOpacity=".35" strokeWidth="2" strokeLinejoin="round"
        />
        <path d="M154 116 Q180 142 206 116" fill="none" stroke="#45413d" strokeOpacity=".3" strokeWidth="2" />
        {top.shape === 5 && <path d="M160 120 V99 Q180 93 200 99 V120 Q180 138 160 120Z" fill={outfit.topColor} stroke="#45413d" strokeOpacity=".35" />}
        {jacket && <path d="M180 128 V266 M154 117 L180 153 L206 117" fill="none" stroke="#45413d" strokeOpacity=".4" strokeWidth="2" />}
        {[3, 4].includes(top.shape) && <path d="M154 116 L180 144 L206 116" fill="none" stroke="#f8f5ed" strokeOpacity=".8" strokeWidth="3" />}
        {[1, 6, 9].includes(top.shape) && <path d="M145 251 Q180 260 215 251" fill="none" stroke="#45413d" strokeOpacity=".3" strokeWidth="3" />}
        {[6, 8, 9].includes(top.shape) && <path d="M150 126 Q180 175 210 126" fill="none" stroke="#45413d" strokeOpacity=".25" strokeWidth="5" />}
        {top.shape === 10 && <path d="M147 183 h23 v24 h-23z M190 183 h23 v24 h-23z" fill="#000" opacity=".12" />}
        {top.shape === 11 && <path d="M137 167 H223" stroke="#fff" strokeOpacity=".55" strokeWidth="5" />}
      </g>
      <path d="M140 480 Q154 489 171 480 L173 501 Q154 508 133 502Z M189 480 Q207 489 220 480 L228 502 Q207 508 187 501Z" fill="#f1eee7" stroke="#777" strokeOpacity=".65" />
    </svg>
  )
}

function ColorRow({
  label, value, change,
}: { label: string; value: string; change: (color: string) => void }) {
  return (
    <div>
      <div className="mb-3 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-stone-500">{value.toUpperCase()}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {palette.map(([name, hex]) => (
          <button
            key={hex} type="button" title={name}
            aria-label={`${label}：${name}`}
            aria-pressed={value.toLowerCase() === hex.toLowerCase()}
            onClick={() => change(hex)}
            className={`h-8 w-8 rounded-full border-2 border-white shadow-sm ring-offset-2 ${
              value.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-stone-800' : 'ring-1 ring-stone-200'
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
        <label className="relative flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white" title="自定义颜色">
          <span aria-hidden="true">＋</span>
          <input
            type="color" value={value} onChange={event => change(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label}自定义颜色`}
          />
        </label>
      </div>
    </div>
  )
}

export default function App() {
  const [outfit, setOutfit] = useState<Outfit>(load)
  const [tab, setTab] = useState<'top' | 'bottom'>('top')
  const [filter, setFilter] = useState<Style | '全部'>('全部')
  const [notice, setNotice] = useState('')
  const score = evaluate(outfit)
  const items = tab === 'top' ? tops : bottoms
  const shown = items.map((item, index) => ({ item, index }))
    .filter(({ item }) => filter === '全部' || item.style === filter)

  useEffect(() => {
    try { localStorage.setItem('virtual-outfit-v1', JSON.stringify(outfit)) }
    catch { /* 存储不可用时仍可试穿 */ }
  }, [outfit])

  function change(part: Partial<Outfit>) {
    setOutfit(current => ({ ...current, ...part }))
    setNotice('')
  }

  function optimize() {
    const currentScore = evaluate(outfit).total
    let best = outfit, bestScore = currentScore, fewestChanges = Infinity
    const colors = [...new Set([...palette.map(([, hex]) => hex), outfit.topColor, outfit.bottomColor])]

    function consider(candidate: Outfit) {
      const value = evaluate(candidate).total
      const changes =
        Number(candidate.top !== outfit.top) + Number(candidate.bottom !== outfit.bottom) +
        Number(candidate.topColor !== outfit.topColor) +
        Number(candidate.bottomColor !== outfit.bottomColor)
      if (value > bestScore || (value === bestScore && changes < fewestChanges)) {
        best = candidate
        bestScore = value
        fewestChanges = changes
      }
    }

    // 第一阶段只调整颜色。
    for (const topColor of colors)
      for (const bottomColor of colors)
        consider({ ...outfit, topColor, bottomColor })

    // 仍未达到 85 分，再尝试只替换一件单品。
    if (bestScore < 85) {
      for (let top = 0; top < tops.length; top++)
        for (const topColor of colors)
          for (const bottomColor of colors)
            consider({ ...outfit, top, topColor, bottomColor })
      for (let bottom = 0; bottom < bottoms.length; bottom++)
        for (const topColor of colors)
          for (const bottomColor of colors)
            consider({ ...outfit, bottom, topColor, bottomColor })
    }

    if (bestScore > currentScore) {
      setOutfit(best)
      setNotice(`已优化：${currentScore} → ${bestScore} 分。`)
    } else {
      setNotice('当前搭配已经很出色，暂时没有更高分的调整。')
    }
  }

  const praise = [
    score.color >= 85 && '上下装的颜色关系自然协调。',
    score.style === 100 && '两件单品风格统一，整体感很强。',
    score.occasion >= 85 && `适合「${outfit.occasion}」场合。`,
  ].filter(Boolean) as string[]

  const tips = [
    score.color < 85 && '可以让其中一件单品更浅或更中性。',
    score.style < 100 && '换成同一风格的单品会更协调。',
    score.occasion < 85 && `试试选择更适合「${outfit.occasion}」的衣裤。`,
  ].filter(Boolean) as string[]

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-7 sm:px-7 lg:px-12">
        <header className="mb-9 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
              YOUR PERSONAL STYLE STUDIO
            </p>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
              今天，穿出你的想法。
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-stone-500">
            自由选择单品与颜色，探索不同场合的搭配灵感。
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.9fr)_minmax(370px,1.1fr)_minmax(275px,0.8fr)]">
          <section className="relative flex min-h-[480px] flex-col overflow-hidden rounded-[2rem] bg-[#edeae2] p-5 sm:min-h-[620px]" aria-label="穿搭预览">
            <div className="relative z-10">
              <p className="text-xs tracking-[0.2em] text-stone-500">LIVE PREVIEW</p>
              <h2 className="mt-1 font-serif text-2xl">穿搭预览</h2>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <Model outfit={outfit} />
            </div>
            <div className="relative z-10 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/80 px-3 py-1.5">{tops[outfit.top].name}</span>
              <span className="rounded-full bg-white/80 px-3 py-1.5">{bottoms[outfit.bottom].name}</span>
            </div>
          </section>

          <section className="min-w-0 rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-7" aria-labelledby="editor-title">
            <p className="mb-1 text-xs tracking-[0.2em] text-stone-500">MAKE IT YOURS</p>
            <h2 id="editor-title" className="mb-6 font-serif text-3xl">自由搭配</h2>

            <div className="mb-5 flex rounded-2xl bg-stone-100 p-1">
              {(['top', 'bottom'] as const).map(value => (
                <button
                  key={value} type="button"
                  onClick={() => { setTab(value); setFilter('全部') }}
                  aria-pressed={tab === value}
                  className={`flex-1 rounded-xl py-2.5 text-sm ${
                    tab === value ? 'bg-white font-medium shadow-sm' : 'text-stone-500'
                  }`}
                >
                  {value === 'top' ? '上衣 · 12 款' : '裤子 · 12 款'}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {(['全部', ...styles] as const).map(value => (
                <button
                  key={value} type="button" onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    filter === value ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >{value}</button>
              ))}
            </div>

            <div className="grid max-h-[310px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map(({ item, index }) => {
                const selected = tab === 'top' ? outfit.top === index : outfit.bottom === index
                const preview = { ...outfit, [tab]: index }
                return (
                  <button
                    key={`${tab}-${index}`} type="button"
                    onClick={() => change({ [tab]: index })}
                    aria-pressed={selected}
                    aria-label={`选择${item.name}`}
                    className={`flex min-w-0 flex-col items-center rounded-2xl border p-2 text-center ${
                      selected ? 'border-stone-800 bg-[#f5f2eb]' : 'border-stone-100 bg-stone-50'
                    }`}
                  >
                    <Model outfit={preview} small />
                    <span className="mt-1 w-full truncate text-[11px] font-medium">{item.name}</span>
                    <span className="text-[10px] text-stone-500">{item.style}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-7 space-y-6 border-t border-stone-100 pt-6">
              <ColorRow label="上衣颜色" value={outfit.topColor} change={topColor => change({ topColor })} />
              <ColorRow label="裤子颜色" value={outfit.bottomColor} change={bottomColor => change({ bottomColor })} />
            </div>

            <div className="mt-7 border-t border-stone-100 pt-6">
              <h3 className="mb-3 text-sm font-medium">穿着场合</h3>
              <div className="flex flex-wrap gap-2">
                {occasions.map(value => (
                  <button
                    key={value} type="button" onClick={() => change({ occasion: value })}
                    aria-pressed={outfit.occasion === value}
                    className={`rounded-full px-4 py-2 text-sm ${
                      outfit.occasion === value
                        ? 'bg-[#dccab1] text-stone-900'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >{value}</button>
                ))}
              </div>
            </div>
          </section>

          <aside>
            <div className="rounded-[2rem] bg-[#303832] p-6 text-white sm:p-7">
              <p className="mb-2 text-xs tracking-[0.2em] text-white/60">STYLE INSIGHT</p>
              <h2 className="font-serif text-3xl">搭配灵感</h2>
              <div className="my-8 flex items-end gap-3">
                <strong className="font-serif text-7xl font-normal leading-none">{score.total}</strong>
                <span className="pb-2 text-sm text-white/65">/ 100 综合评分</span>
              </div>

              <div className="space-y-4 border-y border-white/15 py-6">
                {([
                  ['色彩协调', score.color],
                  ['风格统一', score.style],
                  ['场合适配', score.occasion],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-white/75">{label}</span><span>{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/15" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
                      <div className="h-full rounded-full bg-[#d7c4a5] transition-[width] duration-300" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-5 py-6 text-sm leading-6">
                {praise.length > 0 && <div>
                  <h3 className="mb-2 text-[#e7d2b2]">搭得好在哪里</h3>
                  {praise.map(text => <p key={text} className="text-white/80">✓ {text}</p>)}
                </div>}
                {tips.length > 0 && <div>
                  <h3 className="mb-2 text-[#e7d2b2]">可以试试</h3>
                  {tips.map(text => <p key={text} className="text-white/80">→ {text}</p>)}
                </div>}
              </div>

              <button type="button" onClick={optimize} className="w-full rounded-xl bg-[#e6d4b8] px-4 py-3.5 text-sm font-semibold text-stone-900 hover:bg-[#f0dfc5]">
               ✦ 一键优化搭配
              </button>
              <p role="status" aria-live="polite" className="min-h-6 pt-2 text-center text-xs text-white/75">{notice}</p>
            </div>
            <p className="mt-4 rounded-[1.5rem] border border-stone-200 p-5 text-sm leading-6 text-stone-500">
              评分只是穿搭参考，不是审美的标准答案。喜欢，就是最好的风格。
            </p>
          </aside>
        </div>

        <footer className="pt-10 text-center text-xs text-stone-400">
          当前搭配会自动保存在此浏览器中 · 无需登录
        </footer>
      </div>
    </main>
  )
}
