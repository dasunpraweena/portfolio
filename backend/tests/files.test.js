import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { inspectUpload } from '../src/services/files.js';
import { serve, ADMIN } from './helpers.js';

test('upload validation decodes images and generates safe immutable object keys', async () => {
  const buffer = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#d3f96b' } }).png().toBuffer();
  const file = await inspectUpload({ buffer, originalname:'../../portrait.png', mimetype:'image/png' }, 'IMAGE');
  assert.match(file.privatePath, /^image\/[a-f0-9-]+\.png$/);
  assert.equal(file.originalName,'portrait.png'); assert.equal(file.width,2); assert.equal(file.height,2);
  assert.match(file.sha256,/^[a-f0-9]{64}$/);
});
test('SVG, executable data, spoofed extensions/MIME types, corrupt and oversized images are rejected', async () => {
  const png=await sharp({create:{width:1,height:1,channels:3,background:'#fff'}}).png().toBuffer();
  for (const file of [
    {buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),originalname:'cover.svg',mimetype:'image/svg+xml'},
    {buffer:Buffer.from('MZ executable'),originalname:'cover.jpg',mimetype:'image/jpeg'},
    {buffer:png,originalname:'cover.exe',mimetype:'image/png'},
    {buffer:png,originalname:'cover.png',mimetype:'application/pdf'},
    {buffer:png.subarray(0,24),originalname:'cover.png',mimetype:'image/png'},
    {buffer:Buffer.alloc(8*1024*1024+1),originalname:'cover.png',mimetype:'image/png'},
  ]) await assert.rejects(()=>inspectUpload(file,'IMAGE'),error=>[413,415].includes(error.status));
});
test('PDF validation accepts real PDFs and rejects active documents and damaged content', async () => {
  const document=await PDFDocument.create();document.addPage();
  const buffer=Buffer.from(await document.save());
  const valid=await inspectUpload({buffer,originalname:'cv.pdf',mimetype:'application/pdf'},'PDF');
  assert.equal(valid.kind,'PDF');assert.equal((await PDFDocument.load(valid.buffer)).getPageCount(),1);
  const names=document.context.obj({JavaScript:document.context.obj({Names:[PDFString.of('script'),document.context.obj({S:PDFName.of('JavaScript'),JS:PDFString.of('app.alert(1)')})]})});
  document.catalog.set(PDFName.of('Names'),names);
  const active=Buffer.from(await document.save());
  await assert.rejects(()=>inspectUpload({buffer:active,originalname:'active.pdf',mimetype:'application/pdf'},'PDF'),error=>error.status===415);
});
test('authenticated upload endpoint stores validated files privately and trusts only the verified UUID', async t => {
  const { base, db, supabase }=await serve(t);
  const png=await sharp({create:{width:1,height:1,channels:3,background:'#fff'}}).png().toBuffer();
  const form=new FormData();form.append('file',new Blob([png],{type:'image/png'}),'photo.png');
  const response=await fetch(base+'/api/admin/uploads/image',{method:'POST',headers:{authorization:'Bearer valid.admin.token'},body:form});
  assert.equal(response.status,201);
  assert.equal(db.rows('asset')[0].uploadedBy,ADMIN);
  assert.equal(db.rows('asset')[0].publicPath,undefined);
  assert.equal(supabase.events[0][1],'portfolio-private');
});
