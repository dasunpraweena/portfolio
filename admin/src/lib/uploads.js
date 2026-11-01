export function validateUpload(file, kind) {
  const pdf = kind === 'PDF';
  if (!file || file.size === 0 || file.size > (pdf ? 10 : 8) * 1024 * 1024) return `Choose a nonempty ${pdf ? 'PDF up to 10 MB' : 'image up to 8 MB'}.`;
  if (pdf ? file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name) : !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(?:jpe?g|png|webp)$/i.test(file.name)) return pdf ? 'Choose a PDF file.' : 'Choose a JPEG, PNG, or WebP image. SVG is not supported.';
  return null;
}
