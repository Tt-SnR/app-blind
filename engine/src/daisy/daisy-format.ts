/** 
 * Bảng ánh xạ các namespace thường dùng trong EPUB/DAISY.
 * Dùng khi truy vấn XML bằng XPath để phân biệt prefix.
 */
export const NS = { 
  ocf: "urn:oasis:names:tc:opendocument:xmlns:container", // Namespace cho OCF container.xml
  opf: "http://www.idpf.org/2007/opf",                    // Namespace cho OPF (Open Packaging Format)
  dc: "http://purl.org/dc/elements/1.1/",                 // Namespace Dublin Core (metadata)
  ncx: "http://www.daisy.org/z3986/2005/ncx/"             // Namespace cho NCX (navigation trong EPUB 2)
}; 

/**
 * Dữ liệu đã parse từ file OPF (Open Packaging Format) trong EPUB.
 * File OPF chứa metadata, manifest (danh sách tài nguyên) và spine (thứ tự đọc).
 */
export interface OpfData { 
  path: string; // Đường dẫn tới file OPF
  version: string; // Phiên bản OPF/EPUB (ví dụ "2.0", "3.0")
  metadata: Record<string, string>; 
  // Thông tin metadata dạng key → value, ví dụ { "dc:title": "Tên sách" }

  manifest: Record<string, { href: string; mediaType: string }>; 
  // Manifest ánh xạ id → { href, mediaType }, mô tả tất cả file tài nguyên trong EPUB

  spineItemrefs: string[]; 
  // Danh sách idref của các item trong manifest, xác định thứ tự các chương cần đọc

  ncxPath?: string; 
  // Đường dẫn tới file NCX (nếu có, thường trong EPUB 2)
} 

/**
 * Một điểm trong mục lục NCX (NavPoint).
 * Mỗi NavPoint trỏ tới một vị trí trong sách.
 */
export interface NavPoint { 
  label: string; // Tiêu đề hiển thị trong mục lục
  src: string;   // Đường dẫn đến nội dung (có thể kèm fragment, ví dụ "chapter1.xhtml#para5")
  playOrder?: number; // Thứ tự đọc (tùy chọn, dùng trong NCX)
} 

/**
 * Một đoạn par trong file SMIL (Media Overlay).
 * Dùng để đồng bộ hóa giữa văn bản và âm thanh.
 */
export interface SmilPar { 
  textSrc?: string;   // Đoạn văn bản được tham chiếu
  audioSrc?: string;  // File âm thanh kèm theo
  clipBegin?: number; // Thời điểm bắt đầu (tính bằng giây)
  clipEnd?: number;   // Thời điểm kết thúc (tính bằng giây)
  parId?: string;     // ID của đoạn par
} 

/**
 * Một mục điều hướng đã được "resolve" đầy đủ,
 * kết hợp từ NCX/OPF/SMIL để dùng trong trình đọc EPUB.
 */
export interface ResolvedNavItem { 
  label: string;        // Nhãn hiển thị (ví dụ "Chương 1")
  smilFile?: string;    // File SMIL liên quan (nếu có Media Overlay)
  smilFragment?: string;// Fragment trong SMIL (nếu có)
  textFile?: string;    // File văn bản XHTML liên quan
  textFragment?: string;// Fragment trong file văn bản (ví dụ id trong HTML)
  audioFile?: string;   // File audio liên quan (nếu có)
  clipBegin?: number;   // Thời gian bắt đầu của audio (giây)
  clipEnd?: number;     // Thời gian kết thúc của audio (giây)
}
