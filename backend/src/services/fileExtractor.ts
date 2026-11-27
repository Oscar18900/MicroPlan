import path from 'path';

export interface ExtractedAttachmentText {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  extractedText: string;
  extractionMethod: 'pdf-parse' | 'utf8' | 'ocr' | 'metadata-only';
}

export async function extractAttachmentText(file: {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}): Promise<ExtractedAttachmentText> {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Plain text / Markdown / CSV
  if (file.mimetype.startsWith('text/') || ['.txt', '.md', '.csv'].includes(ext)) {
    const text = file.buffer.toString('utf8').replace(/\s+/g, ' ').trim().slice(0, 8000);
    return {
      fileName: file.originalname,
      fileType: file.mimetype || 'text/plain',
      fileSizeBytes: file.size,
      extractedText: text,
      extractionMethod: 'utf8',
    };
  }

  // 2. PDF via internal pdf-parse entry (avoids pdf-parse v1 test-file ENOENT bug)
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
        buf: Buffer
      ) => Promise<{ text: string }>;
      const parsed = await pdfParse(file.buffer);
      const clean = (parsed.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 8000);
      return {
        fileName: file.originalname,
        fileType: 'application/pdf',
        fileSizeBytes: file.size,
        extractedText: clean,
        extractionMethod: clean ? 'pdf-parse' : 'metadata-only',
      };
    } catch (err) {
      console.warn('PDF parse fallback:', err);
      return {
        fileName: file.originalname,
        fileType: 'application/pdf',
        fileSizeBytes: file.size,
        extractedText: '',
        extractionMethod: 'metadata-only',
      };
    }
  }

  // 3. Images (PNG/JPG/WEBP) via local Tesseract OCR
  if (
    file.mimetype.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)
  ) {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa+eng');
      try {
        const ret = await worker.recognize(file.buffer);
        const clean = (ret.data.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 8000);
        return {
          fileName: file.originalname,
          fileType: file.mimetype || 'image/png',
          fileSizeBytes: file.size,
          extractedText: clean,
          extractionMethod: clean ? 'ocr' : 'metadata-only',
        };
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      console.warn('OCR fallback:', err);
      return {
        fileName: file.originalname,
        fileType: file.mimetype || 'image/png',
        fileSizeBytes: file.size,
        extractedText: '',
        extractionMethod: 'metadata-only',
      };
    }
  }

  return {
    fileName: file.originalname,
    fileType: file.mimetype || 'application/octet-stream',
    fileSizeBytes: file.size,
    extractedText: '',
    extractionMethod: 'metadata-only',
  };
}
