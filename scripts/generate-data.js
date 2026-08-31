/**
 * 鉄道駅LOD (https://uedayou.net/jrslod/) から src/assets/data.json を再生成する。
 *
 *   node scripts/generate-data.js      (または npm run gen:data)
 *
 * 手順:
 *   1. 会社リスト（.../companies/latest.json）から鉄道会社名を集める
 *   2. 各会社ページ {会社名}.json の P527(has part) から路線 URI を集める
 *   3. 各路線 URI の .json をたどって駅数を数え、路線ロゴ URL を拾う
 *      （駅数は src/components/Question.vue の getLineStations と同じロジック）
 *   4. 会社名を表示用にリネーム（COMPANY_RENAME）
 *   5. { company, line, nstation, path?, color?, logo? } の配列にして 1 行 JSON で書き出す
 *
 * 出力フォーマット:
 *   - キー順は company, line, nstation, path?, color?, logo?
 *   - color は路線カラー（Wikidata P465 / #RRGGBB）。存在する路線のみ付与
 *   - company はリネーム後の表示名。表示・ロゴ引き当てのキーになる路線ラベルは
 *     アプリ側で `company + "/" + line` として組み立てる（data.json には持たない）
 *   - path は鉄道駅LOD のリソースパス「元会社名/路線名」。リネームで
 *     `company/line` と異なる路線のみ付与。駅名の fetch にそのまま使う
 *     （無ければ `company/line`。Question.vue の store.linePath 経由）
 *   - logo は存在する路線のみ付与
 *   - 整形なし（1 行）・BOM なし・UTF-8・末尾改行なし
 *   - 並びは `company/line` の昇順（ja ロケール）
 *
 * Node 20.19+ / 22.12+（グローバル fetch）が必要。
 */

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = 'https://uedayou.net/jrslod/'
const COMPANIES_URL = 'https://uedayou.net/static/jrslod/data/companies/latest.json'
const OUT_PATH = fileURLToPath(new URL('../src/assets/data.json', import.meta.url))
const CONCURRENCY = 6

const REL = 'http://purl.org/dc/terms/relation'
const HAS_PART = 'http://purl.org/dc/terms/hasPart'
const P527 = 'http://www.wikidata.org/prop/direct/P527' // has part（会社→路線）
const P465 = 'http://www.wikidata.org/prop/direct/P465' // sRGB color hex triplet（路線カラー）
const LOGO = 'http://schema.org/logo'
const HEX6_RE = /^[0-9A-Fa-f]{6}$/
const LINE_URI_RE = /^https:\/\/uedayou\.net\/jrslod\/[^/]+\/[^/]+$/
// <img src> でそのまま使えるロゴ URL のみ採用する（Wikimedia の画像直リンク
// または data: URI）。ja.wikipedia.org/wiki/ファイル: のような説明ページは除外。
const USABLE_LOGO_RE = /^(https:\/\/upload\.wikimedia\.org\/|data:image\/)/

// 鉄道会社名の表示用リネーム（正式名称 → 通称）
const COMPANY_RENAME = {
  西日本旅客鉄道: 'JR西日本',
  東日本旅客鉄道: 'JR東日本',
  東海旅客鉄道: 'JR東海',
  四国旅客鉄道: 'JR四国',
  九州旅客鉄道: 'JR九州',
  北海道旅客鉄道: 'JR北海道',
  京阪電気鉄道: '京阪電車',
  京浜急行電鉄: '京急電鉄',
  名古屋鉄道: '名鉄',
  近畿日本鉄道: '近鉄',
  大阪市高速電気軌道: '大阪メトロ',
  東京地下鉄: '東京メトロ',
  名古屋市交通局: '名古屋市営地下鉄',
  福岡市交通局: '福岡市地下鉄',
  東京都交通局: '都営地下鉄',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** JSON を取得する。404 は null。それ以外の失敗は指数バックオフでリトライ。 */
async function fetchJson(url, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt >= retries) throw err
      await sleep(500 * 2 ** attempt)
    }
  }
}

/** items を同時実行数 limit で fn に流す。 */
async function pool(items, limit, fn) {
  let cursor = 0
  const runNext = async () => {
    while (cursor < items.length) {
      const item = items[cursor++]
      await fn(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext))
}

/** JSON-LD グラフから、指定プロパティを持つ主語ノードを 1 つ返す。 */
function findNode(graph, uri, prop) {
  if (graph[uri] && graph[uri][prop]) return graph[uri]
  return Object.values(graph).find((node) => node && node[prop])
}

/**
 * 路線 JSON から駅数を数える。
 * Question.vue の getLineStations と同じく dc:relation → ブランクノード →
 * dc:hasPart をたどり、「/会社/路線/駅」の 4 セグメントに一致する URI を数える。
 */
function countStations(graph, lineUri) {
  const node = findNode(graph, lineUri, REL)
  if (!node) return 0
  let count = 0
  for (const rel of node[REL]) {
    const blank = graph[rel.value]
    if (!blank || !blank[HAS_PART]) continue
    for (const part of blank[HAS_PART]) {
      const pathname = new URL(part.value).pathname
      const matches = pathname.match(/^\/([^/]+?)\/([^/]+?)\/([^/]+?)\/(.+$)/i)
      if (matches && matches.length === 5) count++
    }
  }
  return count
}

/** 路線 JSON から路線カラー（#RRGGBB, 大文字）を返す（無ければ null）。 */
function pickColor(graph, lineUri) {
  const node = findNode(graph, lineUri, P465)
  const hex = node && node[P465] && node[P465][0] && node[P465][0].value
  return hex && HEX6_RE.test(hex) ? `#${hex.toUpperCase()}` : null
}

/** 路線 JSON から <img> で使えるロゴ URL を 1 つ返す（無ければ null）。 */
function pickLogo(graph, lineUri) {
  const node = findNode(graph, lineUri, LOGO)
  if (!node) return null
  for (const entry of node[LOGO]) {
    if (USABLE_LOGO_RE.test(entry.value)) return entry.value
  }
  return null
}

/** 路線 URI（https://uedayou.net/jrslod/{会社}/{路線}）を分解。 */
function parseLineUri(lineUri) {
  const segments = new URL(lineUri).pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (segments.length !== 3 || segments[0] !== 'jrslod') return null
  const [, company, line] = segments
  return { company, line, label: `${company}/${line}` }
}

async function main() {
  process.stderr.write('会社リストを取得中...\n')
  const regions = await fetchJson(COMPANIES_URL)
  if (!regions) throw new Error('会社リストを取得できませんでした')
  const companies = [
    ...new Set(
      Object.values(regions)
        .flat()
        .map((entry) => entry.name),
    ),
  ]
  process.stderr.write(`  会社 ${companies.length} 件\n`)

  process.stderr.write('各会社の路線 URI を収集中...\n')
  const lineUris = new Set()
  const companiesWithoutLines = []
  await pool(companies, CONCURRENCY, async (company) => {
    const companyUri = BASE + company
    const graph = await fetchJson(`${companyUri}.json`)
    const node = graph && findNode(graph, companyUri, P527)
    if (!node) {
      companiesWithoutLines.push(company)
      return
    }
    for (const part of node[P527]) {
      if (LINE_URI_RE.test(part.value)) lineUris.add(part.value)
    }
  })
  process.stderr.write(`  路線 ${lineUris.size} 件\n`)

  process.stderr.write('各路線の駅数を取得中...\n')
  const records = []
  const linesNotFound = []
  let processed = 0
  await pool([...lineUris], CONCURRENCY, async (lineUri) => {
    const parsed = parseLineUri(lineUri)
    if (!parsed) return
    const graph = await fetchJson(`${lineUri}.json`)
    processed++
    if (processed % 50 === 0) {
      process.stderr.write(`  ${processed}/${lineUris.size}\n`)
    }
    if (!graph) {
      linesNotFound.push(parsed.label)
      return
    }
    const company = COMPANY_RENAME[parsed.company] || parsed.company
    const record = {
      company,
      line: parsed.line,
      nstation: countStations(graph, lineUri),
    }
    // リネーム時は鉄道駅LOD のリソースパス（元会社名/路線名）を保持（駅名 fetch 用）
    if (company !== parsed.company) record.path = parsed.label
    const color = pickColor(graph, lineUri)
    if (color) record.color = color
    const logo = pickLogo(graph, lineUri)
    if (logo) record.logo = logo
    records.push(record)
  })

  const label = (r) => `${r.company}/${r.line}`
  records.sort((a, b) => label(a).localeCompare(label(b), 'ja'))

  await writeFile(OUT_PATH, JSON.stringify(records), 'utf8')

  process.stderr.write(`\n書き出し: ${OUT_PATH}\n`)
  process.stderr.write(`  路線: ${records.length} 件（駅数 10 以上: ${records.filter((r) => r.nstation >= 10).length} 件）\n`)
  process.stderr.write(`  ロゴあり: ${records.filter((r) => r.logo).length} 件\n`)
  process.stderr.write(`  路線カラーあり: ${records.filter((r) => r.color).length} 件\n`)
  process.stderr.write(`  会社名リネーム: ${records.filter((r) => r.path).length} 件\n`)
  if (companiesWithoutLines.length) {
    process.stderr.write(`  路線を取得できなかった会社 (${companiesWithoutLines.length}): ${companiesWithoutLines.join(', ')}\n`)
  }
  if (linesNotFound.length) {
    process.stderr.write(`  .json が 404 の路線 (${linesNotFound.length}): ${linesNotFound.join(', ')}\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
