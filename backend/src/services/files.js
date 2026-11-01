import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFDict, PDFArray } from 'pdf-lib';
import { ApiError } from '../lib/errors.js';

export async function inspectUpload(file, kind) {
  if (!file) throw new ApiError(422, 'FILE_REQUIRED', 'Upload a file using the multipart field named file.');
  const max = kind === 'PDF' ? 10 * 1024 * 1024 : 8 * 1024 * 1024;
  if (!file.buffer.length || file.buffer.length > max) throw new ApiError(413, 'FILE_TOO_LARGE', kind === 'PDF' ? 'PDFs must be at most 10 MB.' : 'Images must be at most 8 MB.');
  let type;
  try { type = await fileTypeFromBuffer(file.buffer); }
  catch { throw new ApiError(415, 'INVALID_FILE_CONTENT', 'The file header is incomplete or invalid.'); }
  const extension = path.extname(file.originalname).toLowerCase();
  const allowed = kind === 'PDF' ? { pdf: ['.pdf'] } : { jpg: ['.jpg', '.jpeg'], png: ['.png'], webp: ['.webp'] };
  if (!type || !allowed[type.ext]?.includes(extension) || file.mimetype !== type.mime) throw new ApiError(415, 'UNSUPPORTED_FILE', 'The file extension, declared MIME type, and actual content must agree. Use JPEG, PNG, WebP, or PDF as appropriate.');
  let buffer = file.buffer, width = null, height = null;
  try {
    if (kind === 'IMAGE') {
      const image = sharp(buffer, { limitInputPixels: 25000000, failOn: 'warning', animated: false });
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height || (metadata.pages || 1) > 1) throw new Error('Single images only');
      // Fully decode and re-encode the image, dropping metadata and trailing payloads.
      buffer = await image.rotate().toFormat(type.ext === 'jpg' ? 'jpeg' : type.ext).toBuffer();
      const clean = await sharp(buffer).metadata(); width = clean.width; height = clean.height;
    } else {
      if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-')) || !buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) throw new Error('Invalid PDF structure');
      const document = await PDFDocument.load(buffer, { ignoreEncryption: false, updateMetadata: false });
      if (document.getPageCount() < 1 || document.getPageCount() > 500) throw new Error('Invalid page count');
      // Reject active documents and embedded files, including indirect action objects.
      const forbidden = new Set(['JavaScript', 'JS', 'OpenAction', 'AA', 'EmbeddedFiles', 'EF', 'Launch', 'RichMedia', 'XFA']);
      const scanned = new WeakSet();
      const scan = object => {
        if (!object || typeof object !== 'object' || scanned.has(object)) return;
        scanned.add(object);
        if (object instanceof PDFDict) {
          for (const key of object.keys()) if (forbidden.has(key.decodeText())) throw new Error('Active PDF content');
          const action = object.get(PDFName.of('S'));
          if (action instanceof PDFName && ['JavaScript', 'Launch', 'GoToR', 'SubmitForm', 'ImportData'].includes(action.decodeText())) throw new Error('Active PDF action');
          for (const value of object.values()) scan(value);
        } else if (object instanceof PDFArray) for (const value of object.asArray()) scan(value);
      };
      for (const [, object] of document.context.enumerateIndirectObjects()) scan(object);
      buffer = Buffer.from(await document.save());
    }
  } catch { throw new ApiError(415, 'INVALID_FILE_CONTENT', 'The file is damaged, encrypted, oversized in dimensions, animated, or contains unsupported active content.'); }
  if (buffer.length > max) throw new ApiError(413, 'FILE_TOO_LARGE', 'The validated file exceeds the size limit.');
  return { buffer, kind, mimeType: type.mime, sizeBytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex'), width, height,
    privatePath: `${kind.toLowerCase()}/${randomUUID()}.${type.ext}`, originalName: path.basename(file.originalname.replaceAll('\\', '/')).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200) };
}
