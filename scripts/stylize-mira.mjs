// Adapt the licensed CC0 rig; preserve its topology, skeleton, UVs and every expression target.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,meshopt,textureCompress} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {BufferGeometry,BufferAttribute} from 'three';
import sharp from 'sharp';
const source=process.argv[2];if(!source)throw new Error('Pass the original unquantized MPFB GLB path.');
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(source),buffer=doc.getRoot().listBuffers()[0];
const clamp=v=>Math.max(0,Math.min(1,v));
function sculpt(x,y,z){
 const head=clamp((y-1.535)/.075);x*=1+.085*head;
 const center=Math.sign(x||1)*.034,yEye=1.652,dx=x-center,dy=y-yEye;
 const orbital=Math.exp(-Math.pow(dx/.029,4)-Math.pow(dy/.026,4)-Math.pow((z-.139)/.062,4))*clamp((z-.065)/.04);
 x+=dx*orbital*.23;y+=dy*orbital*.34;
 // Round and shorten the lower face slightly, keeping mouth/teeth deformation consistent.
 const jaw=Math.exp(-Math.pow((y-1.573)/.03,2))*head;
 y+=jaw*.006;z-=Math.exp(-Math.pow(x/.016,2)-Math.pow((y-1.62)/.025,2))*head*.005;
 return [x,y,z];
}
for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
 const accessor=primitive.getAttribute('POSITION'),original=accessor.getArray(),positions=new Float32Array(original.length);
 for(let i=0;i<original.length;i+=3)positions.set(sculpt(original[i],original[i+1],original[i+2]),i);
 const geometry=new BufferGeometry().setAttribute('position',new BufferAttribute(positions,3));
 if(primitive.getIndices())geometry.setIndex(new BufferAttribute(primitive.getIndices().getArray(),1));geometry.computeVertexNormals();const normals=geometry.getAttribute('normal').array.slice();
 accessor.setArray(positions);primitive.getAttribute('NORMAL')?.setArray(normals);
 for(const target of primitive.listTargets()){
  const delta=target.getAttribute('POSITION');if(!delta)continue;const old=delta.getArray(),absolute=new Float32Array(old.length),next=new Float32Array(old.length);
  for(let i=0;i<old.length;i+=3){const v=sculpt(original[i]+old[i],original[i+1]+old[i+1],original[i+2]+old[i+2]);for(let j=0;j<3;j++){absolute[i+j]=v[j];next[i+j]=v[j]-positions[i+j]}}
  delta.setArray(next);geometry.setAttribute('position',new BufferAttribute(absolute,3));geometry.computeVertexNormals();const modified=geometry.getAttribute('normal').array,nextNormals=new Float32Array(normals.length);for(let i=0;i<normals.length;i++)nextNormals[i]=modified[i]-normals[i];
  if(target.getAttribute('NORMAL'))target.getAttribute('NORMAL').setArray(nextNormals);else target.setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setBuffer(buffer).setArray(nextNormals));
 }
 geometry.dispose();
}
await doc.transform(dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:85}),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(new URL('../public/avatars/mira-presenter.glb',import.meta.url).pathname,doc);
console.log('Stylized licensed Mira rig with all facial targets preserved.');
