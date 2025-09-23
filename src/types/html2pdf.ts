// TypeScript types for html2pdf.js

export interface Html2PdfOptions {
  margin?: number | [number, number, number, number];
  filename?: string;
  image?: {
    type?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  };
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    letterRendering?: boolean;
    allowTaint?: boolean;
    height?: number;
    width?: number;
  };
  jsPDF?: {
    unit?: 'pt' | 'mm' | 'cm' | 'in';
    format?: 'a4' | 'letter' | 'legal' | [number, number];
    orientation?: 'portrait' | 'landscape';
  };
  pagebreak?: {
    mode?: string | string[];
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
}

export interface Html2PdfInstance {
  from(element: HTMLElement): Html2PdfInstance;
  set(options: Html2PdfOptions): Html2PdfInstance;
  save(): Promise<void>;
  output(type?: string): Promise<string | Blob>;
  outputPdf(type?: string): Promise<string | Blob>;
  outputImg(type?: string): Promise<string>;
}

export interface Html2PdfModule {
  (): Html2PdfInstance;
  default?: Html2PdfModule;
}

export type Html2PdfImport = Html2PdfModule | { default: Html2PdfModule };