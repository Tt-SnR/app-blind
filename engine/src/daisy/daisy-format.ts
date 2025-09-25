export const NS = {
  ocf: "urn:oasis:names:tc:opendocument:xmlns:container",
  opf: "http://www.idpf.org/2007/opf",
  dc: "http://purl.org/dc/elements/1.1/",
  ncx: "http://www.daisy.org/z3986/2005/ncx/"
};

export interface OpfData {
  path: string;
  version: string;
  metadata: Record<string, string>;
  manifest: Record<string, { href: string; mediaType: string }>;
  spineItemrefs: string[];
  ncxPath?: string;
}

export interface NavPoint {
  label: string;
  src: string;
  playOrder?: number;
}

export interface SmilPar {
  textSrc?: string;
  audioSrc?: string;
  clipBegin?: number;
  clipEnd?: number;
  parId?: string;
}

export interface ResolvedNavItem {
  label: string;
  smilFile?: string;
  smilFragment?: string;
  textFile?: string;
  textFragment?: string;
  audioFile?: string;
  clipBegin?: number;
  clipEnd?: number;
}
