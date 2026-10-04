'use client';
import {useEffect,useRef,useState} from 'react';
import type {VisemeCue,MiraEmotion} from '@/lib/mira-speech';
import {blinkAt,gesturePlan,expressionFor,energyAt,solveArm,smoothValue,speechWeights,type SpeechEnergy,type Point3} from '@/lib/mira-motion';
export type MiraPlayback={audio:HTMLAudioElement|null;cues:VisemeCue[];energy?:SpeechEnergy;elapsed:number};
export default function MiraAvatar({playback,motion,topic,emotion}:{playback:()=>MiraPlayback;motion:boolean;topic:string;emotion:MiraEmotion}){
const container=useRef<HTMLDivElement>(null),latest=useRef({playback,motion,topic,emotion});latest.current={playback,motion,topic,emotion};const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
useEffect(()=>{let cancelled=false,dispose=()=>{};async function initialize(){try{
const THREE=await import('three');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const {MeshoptDecoder}=await import('three/addons/libs/meshopt_decoder.module.js');if(cancelled||!container.current)return;
const host=container.current,scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(29,1,.1,20);camera.position.set(0,1.46,2.05);camera.lookAt(0,1.39,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
scene.add(new THREE.HemisphereLight(0xffffff,0x7785a3,2.2));const key=new THREE.DirectionalLight(0xffeee0,2.6);key.position.set(2,3,4);scene.add(key);const fill=new THREE.DirectionalLight(0xd9e9ff,1.4);fill.position.set(-3,1.8,2);scene.add(fill);const rim=new THREE.DirectionalLight(0x94baff,2);rim.position.set(1,2,-3);scene.add(rim);
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);let model:import('three').Group|undefined;let loop=0;const observer=new ResizeObserver(()=>resize());function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}observer.observe(host);resize();
function cleanup(){cancelAnimationFrame(loop);observer.disconnect();if(model)model.traverse(object=>{const mesh=object as import('three').Mesh;if(mesh.isMesh){mesh.geometry.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const material of materials){for(const value of Object.values(material)){if(value instanceof THREE.Texture)value.dispose()}material.dispose()}}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
dispose=cleanup;
const gltf=await loader.loadAsync('/avatars/mira-presenter.glb');if(cancelled){model=gltf.scene;cleanup();return}model=gltf.scene;scene.add(model);
const bones=new Map<string,import('three').Object3D>(),base=new Map<string,import('three').Euler>(),morphs:import('three').Mesh[]=[];model.traverse(object=>{const name=object.name.replace(/^mixamorig:?/,'');if((object as import('three').Bone).isBone){bones.set(name,object);base.set(name,object.rotation.clone())}const mesh=object as import('three').Mesh;if(mesh.isMesh){mesh.frustumCulled=false;if(mesh.morphTargetDictionary&&mesh.morphTargetInfluences)morphs.push(mesh);for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){const m=material as import('three').MeshStandardMaterial;if(m.name.includes('female_casualsuit')){m.map?.dispose();m.map=null;m.color.set('#243b5a');m.roughness=.85}if(m.name.includes('ponytail'))m.color.set('#51473d');if(m.name.includes('body')){m.color.set('#e3b49b');m.roughness=.68}if(m.name.includes('eyelashes')||m.name.includes('eyebrows')){m.side=THREE.DoubleSide;m.alphaTest=.15}}}});
// Rest posture keeps the hands near the waist; gesture offsets are applied to the existing skeletal rig.
for(const [name,sign] of [['LeftArm',1],['RightArm',-1]] as const){const bone=bones.get(name);if(bone){bone.rotation.set(1.25,sign*.18,sign*.04);base.set(name,bone.rotation.clone())}}
const morphNames=new Set(morphs.flatMap(mesh=>Object.keys(mesh.morphTargetDictionary!)));
const smooth:Record<string,number>={};let last=performance.now(),alive=0;
function pose(name:string,x=0,y=0,z=0){const bone=bones.get(name),rest=base.get(name);if(bone&&rest)bone.rotation.set(rest.x+x,rest.y+y,rest.z+z)}
// World-space IK places hands in the presentation area, rather than guessing the rig's elbow axes.
const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),worldQ=new THREE.Quaternion();
function aim(bone:import('three').Object3D,child:import('three').Object3D,target:Point3){
 bone.getWorldPosition(a);child.getWorldPosition(b);b.sub(a).normalize();c.fromArray(target).sub(a).normalize();q.setFromUnitVectors(b,c);bone.getWorldQuaternion(worldQ);q.multiply(worldQ);bone.parent!.getWorldQuaternion(parentQ);bone.quaternion.copy(parentQ.invert().multiply(q));bone.updateMatrixWorld(true);
}
function hand(side:'Left'|'Right',amount:number,beat:number){
 const upper=bones.get(side+'Arm'),lower=bones.get(side+'ForeArm'),wrist=bones.get(side+'Hand');if(!upper||!lower||!wrist)return;
 const sign=side==='Left'?1:-1;pose(side+'Arm');pose(side+'ForeArm');pose(side+'Hand');model!.updateMatrixWorld(true);
 const shoulder=upper.getWorldPosition(new THREE.Vector3()),elbow=lower.getWorldPosition(new THREE.Vector3()),restWrist=wrist.getWorldPosition(new THREE.Vector3());
 const target=restWrist.clone().lerp(new THREE.Vector3(sign*(.19+beat),1.235+beat,.32),amount);
 const pole=elbow.clone().lerp(new THREE.Vector3(sign*.32,1.1,.1),amount);
 const solution=solveArm(shoulder.toArray() as Point3,target.toArray() as Point3,pole.toArray() as Point3,shoulder.distanceTo(elbow),elbow.distanceTo(restWrist));
 aim(upper,lower,solution.elbow);aim(lower,wrist,solution.wrist);
 pose(side+'Hand',-amount*.2,sign*amount*.22,sign*amount*.09);
 for(const finger of ['Index','Middle','Ring','Pinky'])for(let segment=1;segment<=3;segment++)pose(side+'Hand'+finger+segment,amount*(segment===1?.045:.09),0,0);
}
function render(now:number){
 if(cancelled)return;const dt=Math.min(.05,(now-last)/1000);last=now;alive+=dt;
 const {audio,cues,energy,elapsed}=latest.current.playback(),speaking=!!audio&&!audio.paused&&!audio.ended;
 const utterance=speaking?audio.currentTime:0,speechTime=elapsed+utterance,moving=latest.current.motion&&!document.hidden;
 const amplitude=speaking?energyAt(energy,utterance):0,targets=speaking?speechWeights(cues,utterance,amplitude):{};
 const expression=expressionFor(latest.current.topic,latest.current.emotion,speaking,speechTime);
 const articulation=Math.min(1,Object.values(targets).reduce((sum,value)=>sum+value,0));
 // Keep expressions away from the mouth's speech shapes; eyes/brows carry most of the emotion.
 targets.eyeBlinkLeft=targets.eyeBlinkRight=moving?blinkAt(alive):0;
 targets.mouthSmileLeft=targets.mouthSmileRight=expression.smile*(1-articulation*.8);
 targets.cheekSquintLeft=targets.cheekSquintRight=expression.cheek;
 targets.browInnerUp=expression.browInner;
 targets.browOuterUpLeft=targets.browOuterUpRight=expression.browOuter;
 targets.eyeSquintLeft=targets.eyeSquintRight=expression.cheek*.35;
 targets.jawOpen=speaking&&!cues.length?amplitude*.22:0;
 for(const name of morphNames)smooth[name]=smoothValue(smooth[name]||0,targets[name]||0,dt,name.startsWith('eyeBlink')?42:name.startsWith('viseme_')?36:9);
 for(const mesh of morphs)for(const [name,index] of Object.entries(mesh.morphTargetDictionary!))mesh.morphTargetInfluences![index]=smooth[name];
 const plan=gesturePlan(speechTime,latest.current.topic);
 smooth.left=smoothValue(smooth.left||0,moving&&speaking?plan.left:0,dt,5);
 smooth.right=smoothValue(smooth.right||0,moving&&speaking?plan.right:0,dt,5);
 const breathing=moving?Math.sin(alive*1.5)*.005:0,accent=moving&&speaking?Math.sin(speechTime*1.45)*.015:0;
 pose('Head',accent,moving?Math.sin(alive*.43)*.014:0,moving?Math.sin(alive*.32)*.008:0);
 pose('Neck',breathing*.5);pose('Spine2',breathing,0,(smooth.right-smooth.left)*.012);
 hand('Left',smooth.left,plan.beat);hand('Right',smooth.right,-plan.beat);
 model!.position.y=breathing*.15;renderer.render(scene,camera);
 // DOM diagnostics describe visible motion for preview verification; no customer data is exposed.
 host.dataset.speaking=String(speaking);host.dataset.gesture=Math.max(smooth.left,smooth.right).toFixed(2);host.dataset.articulation=articulation.toFixed(2);
 loop=requestAnimationFrame(render);
}
setStatus('ready');loop=requestAnimationFrame(render);
}catch{if(!cancelled)setStatus('fallback');dispose()}}
void initialize();return()=>{cancelled=true;dispose()}},[]);
return <div className="mira-stage" data-renderer={status} role="img" aria-label="Mira, CARWISE’s animated 3D presenter"><div className="mira-stage-light" aria-hidden="true"/><div ref={container} className="mira-canvas"/>{status!=='ready'&&<div className="mira-stage-fallback"><img src="/mira-guide.png" alt=""/><span>{status==='loading'?'Preparing Mira…':'Portrait mode · 3D unavailable'}</span></div>}<div className="mira-stage-caption"><span>MIRA</span><small>Your car-buying guide</small></div></div>
}
