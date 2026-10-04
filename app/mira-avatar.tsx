'use client';
import {useEffect,useRef,useState} from 'react';
import type {VisemeCue,MiraEmotion} from '@/lib/mira-speech';
import {blinkAt,presenterChoreography,facialPerformance,expressionFor,energyAt,solveArm,smoothValue,speechWeights,type SpeechEnergy,type Point3,type PresenterPose} from '@/lib/mira-motion';
export type MiraPlayback={audio:HTMLAudioElement|null;cues:VisemeCue[];energy?:SpeechEnergy;elapsed:number};
export default function MiraAvatar({playback,motion,topic,emotion}:{playback:()=>MiraPlayback;motion:boolean;topic:string;emotion:MiraEmotion}){
const container=useRef<HTMLDivElement>(null),latest=useRef({playback,motion,topic,emotion});latest.current={playback,motion,topic,emotion};const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
useEffect(()=>{let cancelled=false,dispose=()=>{};async function initialize(){try{
const THREE=await import('three');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const {MeshoptDecoder}=await import('three/addons/libs/meshopt_decoder.module.js');if(cancelled||!container.current)return;
const host=container.current,scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28.5,1,.1,20);camera.position.set(0,1.46,2.05);camera.lookAt(0,1.405,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
scene.add(new THREE.HemisphereLight(0xffffff,0x7785a3,2.2));const key=new THREE.DirectionalLight(0xffeee0,2.6);key.position.set(2,3,4);scene.add(key);const fill=new THREE.DirectionalLight(0xd9e9ff,1.4);fill.position.set(-3,1.8,2);scene.add(fill);const rim=new THREE.DirectionalLight(0x94baff,2);rim.position.set(1,2,-3);scene.add(rim);
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);let model:import('three').Group|undefined;let loop=0;const observer=new ResizeObserver(()=>resize());function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}observer.observe(host);resize();
function cleanup(){cancelAnimationFrame(loop);observer.disconnect();if(model)model.traverse(object=>{const mesh=object as import('three').Mesh;if(mesh.isMesh){mesh.geometry.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const material of materials){for(const value of Object.values(material)){if(value instanceof THREE.Texture)value.dispose()}material.dispose()}}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
dispose=cleanup;
const gltf=await loader.loadAsync('/avatars/mira-presenter.glb?v=reference-20261004');if(cancelled){model=gltf.scene;cleanup();return}model=gltf.scene;scene.add(model);
const bones=new Map<string,import('three').Object3D>(),base=new Map<string,import('three').Euler>(),morphs:import('three').Mesh[]=[];model.traverse(object=>{const name=object.name.replace(/^mixamorig:?/,'');if((object as import('three').Bone).isBone){bones.set(name,object);base.set(name,object.rotation.clone())}const mesh=object as import('three').Mesh;if(mesh.isMesh){mesh.frustumCulled=false;if(mesh.morphTargetDictionary&&mesh.morphTargetInfluences)morphs.push(mesh);for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){const m=material as import('three').MeshStandardMaterial;if(m.name.includes('female_casualsuit')){m.map?.dispose();m.map=null;m.color.set('#e8ecf3');m.roughness=.72}if(m.name.includes('ponytail'))m.color.set('#292d38');if(m.name.includes('body')){m.color.set('#e3b49b');m.roughness=.8;m.normalScale?.set(.28,.28)}if(m.name.includes('eyelashes')||m.name.includes('eyebrows')){m.side=THREE.DoubleSide;m.alphaTest=.15}}}});
bones.get('Head')?.scale.setScalar(1.2);
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
const poseNames:PresenterPose[]=['gather','welcome','open','left','right'];
function hand(side:'Left'|'Right',blend:Record<PresenterPose,number>,time:number){
 const upper=bones.get(side+'Arm'),lower=bones.get(side+'ForeArm'),wrist=bones.get(side+'Hand');if(!upper||!lower||!wrist)return;
 const sign=side==='Left'?1:-1,own=side==='Left'?'left':'right',other=side==='Left'?'right':'left',careful=['safety','tradeoffs'].includes(latest.current.topic);
 const horizontalSpace=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*(camera.position.z-.32)*camera.aspect;
 const openX=Math.max(.14,Math.min(careful?.205:.24,horizontalSpace-.18)),beat=(Math.sin(time*2.15)*.011+Math.sin(time*3.7)*.004)*(blend.open+blend[own]);
 const points:Record<PresenterPose,Point3>={gather:[sign*.061,1.205,side==='Left'?.305:.285],welcome:[sign*.048,1.285,.305],open:[sign*openX,1.26+beat,.31],left:side==='Left'?[.235,1.285+beat,.32]:[-.11,1.19,.29],right:side==='Right'?[-.235,1.285+beat,.32]:[.11,1.19,.29]};
 const target=new THREE.Vector3();for(const kind of poseNames)target.addScaledVector(new THREE.Vector3(...points[kind]),blend[kind]);
 pose(side+'Arm');pose(side+'ForeArm');pose(side+'Hand');model!.updateMatrixWorld(true);
 const shoulder=upper.getWorldPosition(new THREE.Vector3()),elbow=lower.getWorldPosition(new THREE.Vector3()),restWrist=wrist.getWorldPosition(new THREE.Vector3());
 const pole=new THREE.Vector3(sign*.30,1.11,.12);
 const solution=solveArm(shoulder.toArray() as Point3,target.toArray() as Point3,pole.toArray() as Point3,shoulder.distanceTo(elbow),elbow.distanceTo(restWrist));
 aim(upper,lower,solution.elbow);aim(lower,wrist,solution.wrist);
 // Preserve gentle finger spread while softening the curl for open explanatory palms.
 const openness=blend.open+blend[own]*.8+blend.welcome*.55;
 for(const finger of ['Index','Middle','Ring','Pinky'])for(let segment=1;segment<=3;segment++){
  const name=side+'Hand'+finger+segment,rest=base.get(name),bone=bones.get(name);if(rest&&bone)bone.rotation.set(rest.x*(1-openness*.5),rest.y*(1-openness*.45),rest.z*(1-openness*.45));
 }
 wrist.updateMatrixWorld(true);
 const middle=bones.get(side+'HandMiddle3'),index=bones.get(side+'HandIndex1'),pinky=bones.get(side+'HandPinky1');if(!middle||!index||!pinky)return;
 const origin=wrist.getWorldPosition(new THREE.Vector3()),forward=middle.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),across=index.getWorldPosition(new THREE.Vector3()).sub(pinky.getWorldPosition(new THREE.Vector3()));
 across.addScaledVector(forward,-across.dot(forward)).normalize();const normal=across.clone().cross(forward).normalize();
 const desiredForward=new THREE.Vector3(-sign*.25,1,.03).multiplyScalar(blend.gather+blend[other]);desiredForward.addScaledVector(new THREE.Vector3(0,1,.03),blend.welcome);desiredForward.addScaledVector(new THREE.Vector3(sign*.94,.38,.03),blend.open);desiredForward.addScaledVector(new THREE.Vector3(sign*.6,.78,.06),blend[own]);desiredForward.normalize();
 const desiredPalm=new THREE.Vector3(-sign*.98,.08,.1).multiplyScalar(blend.gather+blend[other]);desiredPalm.addScaledVector(new THREE.Vector3(-sign,0,0),blend.welcome);desiredPalm.addScaledVector(new THREE.Vector3(0,.7,.72),blend.open+blend[own]);desiredPalm.addScaledVector(desiredForward,-desiredPalm.dot(desiredForward)).normalize().multiplyScalar(-sign);
 const desiredAcross=desiredForward.clone().cross(desiredPalm).normalize();
 const sourceRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,forward,normal)),targetRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(desiredAcross,desiredForward,desiredPalm));
 wrist.getWorldQuaternion(worldQ);q.copy(targetRotation).multiply(sourceRotation.invert()).multiply(worldQ);wrist.parent!.getWorldQuaternion(parentQ);wrist.quaternion.copy(parentQ.invert().multiply(q));wrist.updateMatrixWorld(true);
}
function render(now:number){
 if(cancelled)return;const dt=Math.min(.05,(now-last)/1000);last=now;alive+=dt;
 const {audio,cues,energy,elapsed}=latest.current.playback(),speaking=!!audio&&!audio.paused&&!audio.ended;
 const utterance=speaking?audio.currentTime:0,speechTime=elapsed+utterance,moving=latest.current.motion&&!document.hidden;
 const amplitude=speaking?energyAt(energy,utterance):0,targets=speaking?speechWeights(cues,utterance,amplitude):{};
 const expression=expressionFor(latest.current.topic,latest.current.emotion,speaking,speechTime);
 smooth.energy=smoothValue(smooth.energy||0,amplitude,dt,8);
 const face=facialPerformance(speechTime,smooth.energy,speaking);
 const articulation=Math.min(1,Object.values(targets).reduce((sum,value)=>sum+value,0));
 // Keep expressions away from the mouth's speech shapes; eyes/brows carry most of the emotion.
 targets.eyeBlinkLeft=targets.eyeBlinkRight=moving?blinkAt(alive):0;
 targets.mouthSmileLeft=targets.mouthSmileRight=expression.smile*(1-articulation*.8);
 targets.cheekSquintLeft=targets.cheekSquintRight=expression.cheek+(moving?face.cheek:0);
 targets.browInnerUp=expression.browInner+(moving?face.brow*.55:0);
 targets.browOuterUpLeft=expression.browOuter+(moving?face.brow:0);
 targets.browOuterUpRight=expression.browOuter+(moving?face.brow*.82:0);
 targets.eyeSquintLeft=targets.eyeSquintRight=expression.cheek*.3;
 targets.eyeWideLeft=targets.eyeWideRight=speaking?.055+(moving?face.wide:0):0;
 const gaze=moving?face.gaze:0;targets.eyeLookOutLeft=Math.max(0,gaze);targets.eyeLookInRight=Math.max(0,gaze);targets.eyeLookInLeft=Math.max(0,-gaze);targets.eyeLookOutRight=Math.max(0,-gaze);
 targets.jawOpen=speaking&&!cues.length?amplitude*.22:0;
 for(const name of morphNames)smooth[name]=smoothValue(smooth[name]||0,targets[name]||0,dt,name.startsWith('eyeBlink')?42:name.startsWith('viseme_')?36:9);
 for(const mesh of morphs)for(const [name,index] of Object.entries(mesh.morphTargetDictionary!))mesh.morphTargetInfluences![index]=smooth[name];
 const planned=presenterChoreography(speechTime,latest.current.topic),blend={} as Record<PresenterPose,number>;
 for(const kind of poseNames){const target=moving&&speaking?planned[kind]:kind==='gather'?1:0;blend[kind]=smoothValue(smooth['pose_'+kind]??(kind==='gather'?1:0),target,dt,5);smooth['pose_'+kind]=blend[kind]}
 const breathing=moving?Math.sin(alive*1.5)*.005:0,accent=moving?face.nod:0;
 const tilt=moving?(blend.welcome*.04+face.tilt):0;
 pose('Head',accent,moving?face.yaw:0,tilt);
 pose('Neck',breathing*.5+accent*.18,0,tilt*.15);pose('Spine2',breathing,0,(blend.right-blend.left)*.018);
 hand('Left',blend,speechTime);hand('Right',blend,speechTime);
 model!.position.y=breathing*.15;renderer.render(scene,camera);
 // DOM diagnostics describe visible motion for preview verification; no customer data is exposed.
 host.dataset.speaking=String(speaking);host.dataset.gesture=(1-blend.gather).toFixed(2);host.dataset.articulation=articulation.toFixed(2);
 loop=requestAnimationFrame(render);
}
setStatus('ready');loop=requestAnimationFrame(render);
}catch{if(!cancelled)setStatus('fallback');dispose()}}
void initialize();return()=>{cancelled=true;dispose()}},[]);
return <div className="mira-stage" data-renderer={status} role="img" aria-label="Mira, CARWISE’s animated 3D presenter"><div className="mira-stage-light" aria-hidden="true"/><div ref={container} className="mira-canvas"/>{status!=='ready'&&<div className="mira-stage-fallback"><img src="/mira-guide.png" alt=""/><span>{status==='loading'?'Preparing Mira…':'Portrait mode · 3D unavailable'}</span></div>}<div className="mira-stage-caption"><span>MIRA</span><small>Your car-buying guide</small></div></div>
}
