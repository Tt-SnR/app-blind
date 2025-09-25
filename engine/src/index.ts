// import hàm serve để chạy HTTP server Node dành cho Hono
import { serve } from '@hono/node-server'
// import class Hono (web framework siêu nhẹ) để khai báo route/middleware
import { Hono } from 'hono'
// middleware CORS cho phép gọi API từ domain khác (front-end khác origin)
import { cors } from 'hono/cors'
// Các module lõi của Node.js để thao tác file, đường dẫn, stream
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Readable } from 'node:stream'
// Hàm tạo UUID ngẫu nhiên cho id sách
import { randomUUID } from 'node:crypto'

// ⬇️ THAY đường dẫn import bên dưới thành file chứa các hàm bạn đã viết (findOpf, parseOpf, parseNcx, resolveNavToSync, extractTextFragment)
// import các hàm xử lý DAISY/EPUB mà bạn đã hiện thực ở module riêng
import { findOpf, parseOpf, parseNcx, resolveNavToSync, extractTextFragment } from './daisy/parse-daisy.js'
// import kiểu dữ liệu TypeScript cho rõ ràng và gợi ý IDE
import type { OpfData, NavPoint, ResolvedNavItem } from './daisy/daisy-format.js'

/* =========================
   In-memory “DB” đơn giản
   ========================= */
// Khai báo kiểu BookRecord mô tả một cuốn sách đã đăng ký trên server
type BookRecord = {
  id: string            // định danh duy nhất (UUID)
  title?: string        // tiêu đề hiển thị (tuỳ chọn)
  rootDir: string       // thư mục gốc chứa sách đã giải nén
  opfPath: string       // đường dẫn tuyệt đối tới file OPF
  opf: OpfData          // dữ liệu OPF đã parse
  nav: NavPoint[]       // danh sách điểm mục lục (NCX)
  items: ResolvedNavItem[] // danh sách đã resolve NCX→SMIL→text/audio
}
// "CSDL" trong bộ nhớ: Map<id, BookRecord>. Tiện cho demo/dev, không bền vững sau khi server restart
const books = new Map<string, BookRecord>()

/* =========================
   Helpers
   ========================= */
// resolveUnderOpf: bảo vệ an toàn đường dẫn con tương đối so với thư mục chứa OPF
function resolveUnderOpf(opfPath: string, relFile: string) {
  const safe = path.normalize(relFile)                // chuẩn hoá đường dẫn (loại bớt ký tự dư thừa)
  if (safe.includes('..')) throw new Error('Invalid path') // chặn tấn công path traversal kiểu ../
  const base = path.dirname(opfPath)                  // thư mục gốc làm mốc (thư mục chứa OPF)
  const abs = path.resolve(base, safe)                // biến đường dẫn tương đối thành tuyệt đối
  if (!abs.startsWith(base)) throw new Error('Path traversal') // đảm bảo vẫn nằm trong base
  return abs                                          // trả về đường dẫn tuyệt đối an toàn
}

// detectAudioContentType: suy đoán Content-Type dựa vào phần mở rộng
function detectAudioContentType(p: string) {
  const ext = path.extname(p).toLowerCase()           // lấy .ext và chuyển thường
  if (ext === '.mp3' || ext === '.mp2') return 'audio/mpeg'  // mp3
  if (ext === '.m4a' || ext === '.mp4' || ext === '.aac') return 'audio/mp4' // aac/m4a
  if (ext === '.wav') return 'audio/wav'              // wav
  if (ext === '.ogg' || ext === '.oga') return 'audio/ogg'   // ogg
  return 'application/octet-stream'                   // mặc định
}

/* =========================
   Hono app
   ========================= */
// Khởi tạo app Hono
const app = new Hono()

// Bật CORS cho mọi route ('/*'): cho phép front-end khác origin gọi API
app.use('/*', cors())

// Route GET /: kiểm tra nhanh server sống và routing hoạt động
app.get('/', (c) => c.text('Hello Node.js!'))
// Route GET /health: endpoint health check đơn giản trả JSON { ok: true }
app.get('/health', (c) => c.json({ ok: true }))

// POST /books: đăng ký một cuốn sách từ một thư mục đã giải nén sẵn
app.post('/books', async (c) => {
  try {
    // đọc body JSON (rootDir, title). Nếu không parse được JSON thì trả object rỗng
    const body = await c.req.json<{ rootDir?: string; title?: string }>().catch(() => ({} as any))
    const rootDir = body?.rootDir                      // thư mục gốc chứa EPUB/DAISY đã giải nén
    if (!rootDir) return c.json({ error: 'Missing body.rootDir' }, 400) // thiếu tham số

    // 1) tìm OPF trong rootDir  2) parse OPF  3) nếu có NCX thì parse NCX  4) resolve mục lục sang text/audio
    const opfPath = findOpf(rootDir)
    const opf = parseOpf(opfPath)
    const nav = opf.ncxPath && fs.existsSync(opf.ncxPath) ? parseNcx(opf.ncxPath) : []
    const items = resolveNavToSync(rootDir, opf, nav)

    // tạo id ngẫu nhiên cho sách, đóng gói BookRecord và lưu vào Map
    const id = randomUUID()
    const rec: BookRecord = {
      id,
      title: body.title ?? opf.metadata.title,         // ưu tiên title người dùng đưa, fallback từ metadata OPF
      rootDir,
      opfPath,
      opf,
      nav,
      items,
    }
    books.set(id, rec)                                 // lưu vào "CSDL" trong bộ nhớ

    // trả về thông tin cơ bản, kèm ngôn ngữ (nếu có trong metadata)
    return c.json({ id, title: rec.title ?? 'Untitled', language: opf.metadata.language ?? null }, 201)
  } catch (e: any) {
    // lỗi tổng quát → trả 500 kèm message
    return c.json({ error: e?.message ?? String(e) }, 500)
  }
})

// GET /books: liệt kê danh sách sách đã đăng ký
app.get('/books', (c) => {
  // map BookRecord → object gọn để hiển thị
  const list = [...books.values()].map((b) => ({
    id: b.id,
    title: b.title ?? b.opf.metadata.title ?? 'Untitled',
    language: b.opf.metadata.language ?? null,
  }))
  return c.json(list)                                  // trả JSON danh sách
})

// GET /books/:id/metadata: trả metadata (title/creator/language/…)
app.get('/books/:id/metadata', (c) => {
  const id = c.req.param('id')                         // lấy param id từ URL
  const b = books.get(id)                              // tra cứu trong Map
  if (!b) return c.json({ error: 'Book not found' }, 404) // không thấy → 404
  return c.json(b.opf.metadata)                        // trả metadata gốc từ OPF
})

// GET /books/:id/nav: trả danh sách nav points (NCX)
app.get('/books/:id/nav', (c) => {
  const id = c.req.param('id')
  const b = books.get(id)
  if (!b) return c.json({ error: 'Book not found' }, 404)
  return c.json(b.nav)                                 // trả mảng NavPoint
})

// GET /books/:id/items: trả danh sách đã resolve (NCX→SMIL→text/audio), có phân trang
app.get('/books/:id/items', (c) => {
  const id = c.req.param('id')
  const b = books.get(id)
  if (!b) return c.json({ error: 'Book not found' }, 404)
  const offset = Number(c.req.query('offset') ?? 0)    // mặc định 0
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200) // giới hạn tối đa 200
  const slice = b.items.slice(offset, offset + limit)  // cắt lát kết quả
  return c.json({ total: b.items.length, items: slice }) // trả tổng và trang hiện tại
})

// GET /books/:id/text?file=...&frag=...: trích văn bản từ file XML/HTML kèm fragment id (tuỳ chọn)
app.get('/books/:id/text', (c) => {
  try {
    const id = c.req.param('id')
    const file = c.req.query('file')                   // đường dẫn tương đối tới file nội dung
    const frag = c.req.query('frag') ?? undefined      // id fragment (nếu có)
    if (!file) return c.json({ error: 'Missing query ?file=' }, 400) // bắt buộc có file
    const b = books.get(id)
    if (!b) return c.json({ error: 'Book not found' }, 404)

    const abs = resolveUnderOpf(b.opfPath, file)       // resolve & kiểm tra an toàn đường dẫn
    const text = extractTextFragment(abs, frag)        // trích toàn bộ/vùng text theo frag
    // trả về plain text UTF-8
    return new Response(text, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e: any) {
    return c.json({ error: e?.message ?? String(e) }, 500)
  }
})

// GET /books/:id/audio?file=...: stream audio (hỗ trợ HTTP Range)
// Nếu client gửi header Range → trả 206 Partial Content, cho phép tua/seek hiệu quả
app.get('/books/:id/audio', (c) => {
  try {
    const id = c.req.param('id')
    const file = c.req.query('file')                   // đường dẫn audio tương đối (ví dụ OEBPS/audio/part1.mp3)
    if (!file) return c.json({ error: 'Missing query ?file=' }, 400)
    const b = books.get(id)
    if (!b) return c.json({ error: 'Book not found' }, 404)

    const abs = resolveUnderOpf(b.opfPath, file)       // resolve & kiểm tra path traversal
    if (!fs.existsSync(abs)) return c.json({ error: 'Audio file not found' }, 404)
    const stat = fs.statSync(abs)                      // lấy kích thước file
    const total = stat.size
    const range = c.req.header('range')                // đọc header Range (nếu có), ví dụ "bytes=0-1023"
    const contentType = detectAudioContentType(abs)    // xác định Content-Type theo phần mở rộng

    // Nếu có Range → tính toán start/end và trả 206 Partial Content
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range)        // regex bắt 2 nhóm số trong Range
      const start = m?.[1] ? parseInt(m[1], 10) : 0    // vị trí bắt đầu (mặc định 0)
      const end = m?.[2] ? parseInt(m[2], 10) : total - 1 // vị trí kết thúc (mặc định cuối file)
      if (start >= total || end >= total) return c.json({ error: 'Requested range not satisfiable' }, 416) // Range sai

      const nodeStream = fs.createReadStream(abs, { start, end }) // tạo stream phần dữ liệu theo khoảng
      const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream // chuyển Node stream → Web stream cho Response
      // Trả 206 + header Content-Range/Length/Accept-Ranges để client hiểu và tua tiếp
      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(end - start + 1),
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
        },
      })
    }

    // Không có Range: trả toàn bộ file (200 OK) — vẫn kèm Accept-Ranges để client có thể yêu cầu Range lần sau
    const nodeStream = fs.createReadStream(abs)
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream
    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (e: any) {
    // lỗi tổng quát khi stream → trả 500
    return c.json({ error: e?.message ?? String(e) }, 500)
  }
})

// Error handler mặc định của Hono: log lỗi và trả JSON 500
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err?.message ?? String(err) }, 500)
})

// Khởi động HTTP server Node với handler fetch của Hono.
// PORT lấy từ biến môi trường, mặc định 4000.
serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 4000,
})
