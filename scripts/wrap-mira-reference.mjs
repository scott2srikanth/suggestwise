// Bake the supplied portrait into the existing rig's UV surfaces. Geometry, skinning and morphs are retained.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dequantize,meshopt} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';
import {Matrix4,Vector3} from 'three';
import sharp from 'sharp';
await MeshoptDecoder.ready;await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const doc=await io.read('public/avatars/mira-presenter.glb');await doc.transform(dequantize());
const ref=await sharp('public/avatars/mira-reference-portrait.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const clamp=v=>Math.max(0,Math.min(1,v));const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
function photo(u,v){const x=Math.max(0,Math.min(ref.info.width-1,u*ref.info.width)),y=Math.max(0,Math.min(ref.info.height-1,v*ref.info.height)),x0=Math.floor(x),y0=Math.floor(y),dx=x-x0,dy=y-y0;let out=[0,0,0,0];for(let j=0;j<2;j++)for(let i=0;i<2;i++){const at=(Math.min(ref.info.height-1,y0+j)*ref.info.width+Math.min(ref.info.width-1,x0+i))*4,w=(i?dx:1-dx)*(j?dy:1-dy);for(let c=0;c<4;c++)out[c]+=ref.data[at+c]*w}return out}
const faceY=[[1.535,.489],[1.578,.398],[1.615,.35],[1.65,.286],[1.674,.247],[1.735,.145]];
function fy(y){for(let i=1;i<faceY.length;i++)if(y<=faceY[i][0]){const [a,u]=faceY[i-1],[b,v]=faceY[i];return u+(v-u)*clamp((y-a)/(b-a))}return .145}
for(const node of doc.getRoot().listNodes().filter(n=>n.getMesh())){
 const material=node.getMesh().listPrimitives()[0].getMaterial(),name=material.getName();if(!name.includes('body')&&!name.includes('female_casualsuit'))continue;
 const body=name.includes('body'),size=1024,texture=material.getBaseColorTexture();
 const original=await sharp(texture.getImage()).resize(size,size).ensureAlpha().raw().toBuffer();const output=Buffer.from(original);
 // Make the neutral skin tone consistent with the photograph outside its front-facing projection.
 if(body)for(let i=0;i<output.length;i+=4){output[i]=Math.min(255,output[i]*1.02);output[i+1]*=.9;output[i+2]*=.82}
 else for(let i=0;i<output.length;i+=4){output[i]=24;output[i+1]=39;output[i+2]=67}
 const skin=node.getSkin(),matrices=skin.listJoints().map((j,i)=>new Matrix4().fromArray(j.getWorldMatrix()).multiply(new Matrix4().fromArray(skin.getInverseBindMatrices().getElement(i,[]))));
 for(const primitive of node.getMesh().listPrimitives()){
 const positions=primitive.getAttribute('POSITION'),uv=primitive.getAttribute('TEXCOORD_0'),joints=primitive.getAttribute('JOINTS_0'),weights=primitive.getAttribute('WEIGHTS_0');if(!uv)continue;
 const points=[];for(let i=0;i<positions.getCount();i++){const p=positions.getElement(i,[]),js=joints.getElement(i,[]),ws=weights.getElement(i,[]),v=new Vector3();for(let k=0;k<4;k++)v.addScaledVector(new Vector3(...p).applyMatrix4(matrices[js[k]]),ws[k]);points.push(v.toArray())}
 const indices=primitive.getIndices()?.getArray()||Array.from({length:positions.getCount()},(_,i)=>i);
 for(let t=0;t<indices.length;t+=3){const ids=[indices[t],indices[t+1],indices[t+2]],ps=ids.map(i=>points[i]);if(body&&Math.max(...ps.map(p=>p[1]))<1.525)continue;const uvs=ids.map(i=>uv.getElement(i,[]).map(v=>v*(size-1))),[a,b,c]=uvs,det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<.001)continue;
 const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(size-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(size-1,Math.ceil(Math.max(a[1],b[1],c[1])));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const wa=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det,wb=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det,wc=1-wa-wb;if(wa<-.005||wb<-.005||wc<-.005)continue;const p=[0,1,2].map(k=>ps[0][k]*wa+ps[1][k]*wb+ps[2][k]*wc);let amount,source;
 if(body){amount=smooth(.06,.125,p[2])*smooth(1.525,1.55,p[1])*(1-smooth(1.71,1.74,p[1]))*(1-smooth(.068,.095,Math.abs(p[0])));source=photo(.505+p[0]*1.85,fy(p[1]));}
 else{amount=smooth(.02,.10,p[2])*smooth(1.06,1.17,p[1]);source=photo(.5+p[0]*1.38,.58+(1.495-p[1])*1.08)}
 amount*=source[3]/255;const at=(y*size+x)*4;for(let k=0;k<3;k++)output[at+k]=output[at+k]*(1-amount)+source[k]*amount;
 }
 }
 }
 const image=await sharp(output,{raw:{width:size,height:size,channels:4}}).webp({quality:92}).toBuffer();const path=`public/avatars/mira-reference-${body?'skin':'outfit'}.webp`;await sharp(image).toFile(path);texture.setImage(image).setMimeType('image/webp').setName(`mira_reference_${body?'skin':'outfit'}`);material.setBaseColorFactor([1,1,1,1]);console.log(`Baked reference onto ${name} UVs`);
}
await doc.transform(meshopt({encoder:MeshoptEncoder,level:'medium'}));await io.write('public/avatars/mira-reference-3d.glb',doc);
