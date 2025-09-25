import { DOMParser } from "xmldom";
import * as xpath from "xpath";
import * as fs from "node:fs";
import * as path from "node:path";
import { NS } from "./daisy-format.js";


export const selectNs = xpath.useNamespaces(NS);

export function parseXml(xmlStr: string) {
  return new DOMParser({
    errorHandler: { warning: undefined, error: undefined, fatalError: undefined }
  }).parseFromString(xmlStr, "text/xml");
}

export function readFileText(p: string): string {
  return fs.readFileSync(p, "utf8");
}

export function splitHref(href: string): { file: string; frag?: string } {
  const i = href.indexOf("#");
  return i >= 0 ? { file: href.slice(0, i), frag: href.slice(i + 1) } : { file: href };
}

export function hmsToSeconds(hms: string): number {
  if (/^\d+(\.\d+)?$/.test(hms)) return parseFloat(hms);    
  const parts = hms.split(":").map(Number);
  while (parts.length < 3) parts.unshift(0);
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
}

export function getNodeAllText(node: Node): string {
  let s = "";
  function dfs(n: Node) {
    if ((n as any).nodeType === 3) s += n.nodeValue || "";
    const kids = (n as any).childNodes || [];
    for (let i = 0; i < kids.length; i++) dfs(kids[i]);
  }
  dfs(node);
  return s;
}

export function resolvePath(baseFile: string, rel: string): string {
  return path.resolve(path.dirname(baseFile), rel);
}
