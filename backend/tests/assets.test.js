import test from 'node:test';
import assert from 'node:assert/strict';
import { serve } from './helpers.js';
import { seedData } from '../prisma/seed.js';
const PROJECT='33333333-3333-4333-8333-333333333333', ASSET='44444444-4444-4444-8444-444444444444', OTHER='55555555-5555-4555-8555-555555555555';
const fixtures=()=>({project:[{id:PROJECT,...seedData.projects[0]}],asset:[{id:ASSET,kind:'IMAGE',privatePath:'image/test.png',publicPath:null,mimeType:'image/png',sizeBytes:4}],projectAsset:[{projectId:PROJECT,assetId:ASSET,sortOrder:0,illustrative:false}]});
test('draft files are inaccessible, publishing copies to the published-assets bucket, and unpublishing revokes delivery',async t=>{
  const {request,supabase}=await serve(t,fixtures());supabase.files.set('portfolio-private/image/test.png',Buffer.from('test'));
  assert.equal((await request('/api/assets/'+ASSET)).status,404);
  const options={token:'valid.admin.token',method:'PATCH'};
  assert.equal((await request('/api/admin/projects/'+PROJECT+'/publication',{...options,body:{status:'PUBLISHED'}})).status,200);
  assert.equal((await request('/api/assets/'+ASSET)).status,200);
  assert.equal(supabase.events[0][1],'portfolio-public');
  const dto=await(await request('/api/projects/marketplace')).json();
  assert.equal(dto.data.screenshots[0].url,'/api/assets/'+ASSET);assert.ok(!JSON.stringify(dto).includes('privatePath'));
  assert.equal((await request('/api/admin/projects/'+PROJECT+'/publication',{...options,body:{status:'DRAFT'}})).status,200);
  assert.equal((await request('/api/assets/'+ASSET)).status,404);
  assert.equal(supabase.files.has('portfolio-public/image/test.png'),false);
  assert.equal(supabase.files.has('portfolio-private/image/test.png'),true);
});
test('shared files stay available to other published content and referenced files cannot be deleted',async t=>{
  const fixture=fixtures();fixture.project[0].status='PUBLISHED';fixture.asset[0].publicPath='image/test.png';
  fixture.project.push({...fixture.project[0],id:OTHER,slug:'shared'});fixture.projectAsset.push({projectId:OTHER,assetId:ASSET,sortOrder:0});
  const {request,supabase}=await serve(t,fixture);supabase.files.set('portfolio-public/image/test.png',Buffer.from('test'));
  await request('/api/admin/projects/'+PROJECT+'/publication',{token:'valid.admin.token',method:'PATCH',body:{status:'DRAFT'}});
  assert.equal((await request('/api/assets/'+ASSET)).status,200);
  assert.equal((await request('/api/admin/assets/'+ASSET,{token:'valid.admin.token',method:'DELETE'})).status,409);
  assert.ok(supabase.files.has('portfolio-public/image/test.png'));
});
test('failed storage publication rolls back content visibility',async t=>{
  const {request,db,supabase}=await serve(t,fixtures());supabase.files.set('portfolio-private/image/test.png',Buffer.from('test'));supabase.failUpload=true;
  const response=await request('/api/admin/projects/'+PROJECT+'/publication',{token:'valid.admin.token',method:'PATCH',body:{status:'PUBLISHED'}});
  assert.equal(response.status,503);assert.equal(db.rows('project')[0].status,'DRAFT');assert.equal(db.rows('asset')[0].publicPath,null);
  assert.equal((await request('/api/assets/'+ASSET)).status,404);
});
test('unknown and unpublished assets do not reveal their existence or storage keys',async t=>{
  const {request}=await serve(t,fixtures());
  for(const id of [ASSET,OTHER]){const response=await request('/api/assets/'+id);assert.equal(response.status,404);assert.ok(!JSON.stringify(await response.json()).includes('image/test.png'));}
});
