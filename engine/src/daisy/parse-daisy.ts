import * as fs from "node:fs";
import * as path from "node:path";
import * as xpath from "xpath";
import { parseXml, readFileText, selectNs, splitHref, hmsToSeconds, getNodeAllText, resolvePath } from "./utils.js";
import type { NS, OpfData, NavPoint, SmilPar, ResolvedNavItem } from "./daisy-format.js";

// Bước 1 — tìm OPF
export function findOpf(rootDir: string): string {
  const container = path.join(rootDir, "META-INF", "container.xml");
  if (fs.existsSync(container)) {
    const doc = parseXml(readFileText(container));
    const nodes = selectNs("//ocf:rootfile/@full-path", doc) as Attr[];
    if (nodes?.length) {
      const fullPath = nodes[0].value;
      const opfPath = path.resolve(rootDir, fullPath);
      if (fs.existsSync(opfPath)) return opfPath;
    }
  }
  // fallback: scan *.opf
  const candidates: string[] = [];
  function walk(dir: string) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        if (f !== "node_modules" && f !== ".git") walk(p);
      } else if (f.toLowerCase().endsWith(".opf")) {
        candidates.push(p);
      }
    }
  }
  walk(rootDir);
  if (!candidates.length) throw new Error("Không tìm thấy file OPF.");
  candidates.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
  return candidates[0];
}

// Bước 2 — parse OPF
export function parseOpf(opfPath: string): OpfData {
  const doc = parseXml(readFileText(opfPath));
  const root = doc.documentElement;
  const version = root.getAttribute("version")?.trim() || "2.0";

  const metadataKeys = ["title", "creator", "language", "publisher", "date", "identifier"];
  const metadata: Record<string, string> = {};
  for (const key of metadataKeys) {
    const nodeDc = selectNs(`//dc:${key}`, doc) as Node[];
    const nodeNo = xpath.select(`//${key}`, doc) as Node[];
    const node = (nodeDc && nodeDc[0]) || (nodeNo && nodeNo[0]);
    const text = node?.textContent?.trim();
    if (text) metadata[key] = text;
  }

  const manifest: OpfData["manifest"] = {};
  const items = (selectNs("//opf:manifest/opf:item", doc) as Element[]).concat(
    (xpath.select("//manifest/item", doc) as Element[]) || []
  );
  for (const it of items) {
    const id = it.getAttribute("id") || "";
    const href = it.getAttribute("href") || "";
    const mt = it.getAttribute("media-type") || "";
    if (id && href) manifest[id] = { href, mediaType: mt };
  }

  const spine = (selectNs("//opf:spine", doc)[0] as Element) || (xpath.select("//spine", doc)[0] as Element);
  const spineItemrefs: string[] = [];
  let ncxId: string | undefined;
  if (spine) {
    ncxId = spine.getAttribute("toc") || undefined;
    const itemrefs = (selectNs("opf:itemref", spine) as Element[]).concat(
      (xpath.select("itemref", spine) as Element[]) || []
    );
    for (const ir of itemrefs) {
      const idref = ir.getAttribute("idref");
      if (idref) spineItemrefs.push(idref);
    }
  }

  let ncxPath: string | undefined;
  if (ncxId && manifest[ncxId]) {
    ncxPath = resolvePath(opfPath, manifest[ncxId].href);
  } else {
    for (const k of Object.keys(manifest)) {
      const mt = manifest[k].mediaType;
      if (mt === "application/x-dtbncx+xml" || mt === "application/x-daisy-ncx+xml") {
        ncxPath = resolvePath(opfPath, manifest[k].href);
        break;
      }
    }
  }

  return { path: opfPath, version, metadata, manifest, spineItemrefs, ncxPath };
}

// Bước 3 — parse NCX
export function parseNcx(ncxPath: string): NavPoint[] {
  const doc = parseXml(readFileText(ncxPath));
  const navMap = (selectNs("//ncx:navMap", doc)[0] as Element) || (xpath.select("//navMap", doc)[0] as Element);
  if (!navMap) return [];

  const points: NavPoint[] = [];
  function walk(el: Element) {
    const children = (selectNs("ncx:navPoint", el) as Element[]).concat(
      (xpath.select("navPoint", el) as Element[]) || []
    );
    for (const np of children) {
      const labelNode =
        (selectNs(".//ncx:text", np)[0] as Element) || (xpath.select(".//text", np)[0] as Element);
      const label = labelNode?.textContent?.trim() ?? "";
      const content =
        (selectNs(".//ncx:content", np)[0] as Element) || (xpath.select(".//content", np)[0] as Element);
      const src = content?.getAttribute("src") ?? "";
      const playOrderStr = np.getAttribute("playOrder") || undefined;
      const playOrder = playOrderStr && /^\d+$/.test(playOrderStr) ? Number(playOrderStr) : undefined;

      points.push({ label, src, playOrder });
      walk(np);
    }
  }
  walk(navMap);
  return points;
}

// Bước 4 — parse SMIL
export function parseSmil(smilPath: string): SmilPar[] {
  const doc = parseXml(readFileText(smilPath));
  const pars = (xpath.select("//par", doc) as Element[]).concat((selectNs("//smil:par", doc) as Element[]) || []);
  const out: SmilPar[] = [];
  for (const par of pars) {
    const textEl = (xpath.select(".//text", par)[0] as Element) || (selectNs(".//smil:text", par)[0] as Element);
    const audioEl = (xpath.select(".//audio", par)[0] as Element) || (selectNs(".//smil:audio", par)[0] as Element);

    const textSrc = textEl?.getAttribute("src") || undefined;
    const audioSrc = audioEl?.getAttribute("src") || undefined;
    const clipBegin = audioEl?.getAttribute("clipBegin");
    const clipEnd = audioEl?.getAttribute("clipEnd");

    out.push({
      textSrc,
      audioSrc,
      clipBegin: clipBegin ? hmsToSeconds(clipBegin) : undefined,
      clipEnd: clipEnd ? hmsToSeconds(clipEnd) : undefined,
      parId: par.getAttribute("id") || undefined
    });
  }
  return out;
}

// Bước 5 — trích text fragment từ XML/HTML
export function extractTextFragment(xmlPath: string, fragId?: string): string {
  const doc = parseXml(readFileText(xmlPath));
  if (fragId) {
    const node =
      (xpath.select(`//*[@id='${fragId}']`, doc)[0] as Element) ||
      (xpath.select(`//*[local-name() and @id='${fragId}']`, doc)[0] as Element);
    if (node) return getNodeAllText(node).trim();
  }
  return getNodeAllText(doc.documentElement).trim();
}

// Bước 6 — Ghép NCX -> SMIL -> Text/Audio
export function resolveNavToSync(bookRoot: string, opf: OpfData, navPoints: NavPoint[]): ResolvedNavItem[] {
  const results: ResolvedNavItem[] = [];
  for (const p of navPoints) {
    if (!p.src) {
      results.push({ label: p.label });
      continue;
    }
    const { file, frag } = splitHref(p.src);
    const full = resolvePath(opf.path, file);

    if (full.toLowerCase().endsWith(".smil")) {
      const pars = parseSmil(full);
      let par: SmilPar | undefined;
      par = frag ? pars.find(x => x.parId === frag) : pars[0];

      let textFile: string | undefined;
      let textFragment: string | undefined;
      let audioFile: string | undefined;
      let cb: number | undefined;
      let ce: number | undefined;

      if (par) {
        if (par.textSrc) {
          const t = splitHref(par.textSrc);
          textFile = resolvePath(full, t.file);
          textFragment = t.frag;
        }
        if (par.audioSrc) {
          audioFile = resolvePath(full, par.audioSrc);
          cb = par.clipBegin;
          ce = par.clipEnd;
        }
      }

      results.push({
        label: p.label,
        smilFile: full,
        smilFragment: frag,
        textFile,
        textFragment,
        audioFile,
        clipBegin: cb,
        clipEnd: ce
      });
    } else {
      const textFile = fs.existsSync(full) ? full : undefined;
      results.push({
        label: p.label,
        textFile,
        textFragment: frag
      });
    }
  }
  return results;
}

// Bước 7 — Demo end-to-end
export function demoReadDaisy(bookRoot: string) {
  const opfPath = findOpf(bookRoot);
  console.log("OPF:", opfPath);

  const opf = parseOpf(opfPath);
  console.log("Metadata:", opf.metadata);
  console.log("Spine length:", opf.spineItemrefs.length);

  let nav: NavPoint[] = [];
  if (opf.ncxPath && fs.existsSync(opf.ncxPath)) {
    nav = parseNcx(opf.ncxPath);
    console.log("NCX points:", nav.length);
  } else {
    console.log("Không tìm thấy NCX.");
  }

  const items = resolveNavToSync(bookRoot, opf, nav);
  for (let i = 0; i < Math.min(5, items.length); i++) {
    const it = items[i];
    console.log(`\n=== Mục ${i + 1}: ${it.label}`);
    if (it.textFile) {
      try {
        const snippet = extractTextFragment(it.textFile, it.textFragment);
        console.log("Text snippet:", snippet.length > 200 ? snippet.slice(0, 200) + "..." : snippet);
      } catch (e: any) {
        console.log("Không đọc được text:", e?.message || e);
      }
    }
    if (it.audioFile) {
      console.log(
        "Audio:",
        path.basename(it.audioFile),
        "|",
        it.clipBegin ?? "-",
        "->",
        it.clipEnd ?? "-",
        "giây"
      );
    }
    if (it.smilFile) {
      console.log("SMIL:", path.basename(it.smilFile), "#", it.smilFragment ?? "");
    }
  }
}
