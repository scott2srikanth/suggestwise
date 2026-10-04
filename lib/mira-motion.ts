import type {VisemeCue,MiraEmotion} from './mira-speech';
export type SpeechEnergy={step:number;values:Float32Array};
export type Point3=[number,number,number];
export function smoothValue(current:number,target:number,seconds:number,response=18){const dt=Math.min(.05,Math.max(0,seconds));return current+(target-current)*(1-Math.exp(-response*dt))}
export function speechEnergy(samples:Float32Array,sampleRate:number):SpeechEnergy{
 const step=.02,size=Math.max(1,Math.round(sampleRate*step)),values=new Float32Array(Math.ceil(samples.length/size));
 for(let i=0;i<values.length;i++){let sum=0,count=0;for(let j=i*size;j<Math.min(samples.length,(i+1)*size);j++){sum+=samples[j]*samples[j];count++}values[i]=Math.min(1,Math.max(0,(Math.sqrt(sum/Math.max(1,count))-.006)/.105))}
 return {step,values};
}
export function energyAt(energy:SpeechEnergy|undefined,time:number){if(!energy)return 1;const index=time/energy.step,lo=Math.floor(index);if(lo<0||lo>=energy.values.length)return 0;return energy.values[lo]*(1-(index-lo))+(energy.values[lo+1]||0)*(index-lo)}
export function speechWeights(cues:VisemeCue[],time:number,energy=1){
 const weights:Record<string,number>={};let low=0,high=cues.length-1,index=-1;
 while(low<=high){const mid=(low+high)>>1;if(cues[mid].seconds<=time+.03){index=mid;low=mid+1}else high=mid-1}
 for(let i=Math.max(0,index-2);i<=Math.min(cues.length-1,index+1);i++){
  const c=cues[i],kind=c.viseme;if(!kind||kind==='sil')continue;
  const start=c.seconds-.03,end=c.seconds+c.duration+.02;if(time<start||time>end)continue;
  const attack=Math.min(1,(time-start)/Math.min(.04,Math.max(.015,c.duration*.4))),release=Math.min(1,(end-time)/.035);
  const amplitude=kind==='PP'?1:.3+.7*Math.min(1,Math.max(0,energy));
  weights['viseme_'+kind]=Math.max(weights['viseme_'+kind]||0,Math.max(0,Math.min(attack,release))*.9*amplitude);
 }
 const total=Object.values(weights).reduce((sum,value)=>sum+value,0);if(total>.95)for(const name of Object.keys(weights))weights[name]*=.95/total;return weights;
}
export function blinkAt(time:number){const cycle=Math.floor((time+1.15)/4.8),phase=(time+1.15)%4.8;const double=cycle%3===2;const t=phase<.2?phase:double&&phase>.34&&phase<.52?(phase-.34)*.2/.18:-1;return t>=0?Math.sin(Math.PI*t/.2)**2:0}
export function gestureAt(time:number,enabled:boolean){if(!enabled)return 0;const cycle=(time+.15)%7.2;if(cycle<.6||cycle>3.9)return 0;const up=Math.min(1,(cycle-.6)/.85),down=Math.min(1,(3.9-cycle)/1.15),t=Math.min(up,down);return t*t*(3-2*t)}
export function gesturePlan(time:number,topic:string){
 const emphasis=gestureAt(time,true),turn=Math.floor((time+.15)/7.2)%2,careful=topic==='safety'||topic==='tradeoffs';
 const left=topic==='compare'?emphasis:turn===0?emphasis:emphasis*.12,right=topic==='compare'?emphasis*.88:turn===1?emphasis:emphasis*.12;
 return {left:left*(careful?.75:1),right:right*(careful?.75:1),beat:Math.sin(Math.max(0,time%7.2-1.5)*3.4)*emphasis*.015};
}
export function expressionFor(topic:string,emotion:MiraEmotion,speaking:boolean,time:number){
 const delivery=emotion==='auto'?(['safety','tradeoffs'].includes(topic)?'empathetic':'neutral'):emotion;
 const pulse=speaking?(.5+.5*Math.sin(time*1.35)):0;
 return {smile:delivery==='cheerful'?.42:delivery==='empathetic'?.12:.27,cheek:delivery==='cheerful'?.17:.07,browInner:delivery==='empathetic'?.13+pulse*.07:.035+pulse*.055,browOuter:delivery==='cheerful'?.1+pulse*.055:.025+pulse*.025};
}
/** Analytical two-bone reach. The pole places the elbow outside the torso. */
export function solveArm(shoulder:Point3,target:Point3,pole:Point3,upper:number,lower:number){
 const sub=(a:Point3,b:Point3):Point3=>a.map((v,i)=>v-b[i]) as Point3;
 const length=(v:Point3)=>Math.hypot(...v),dot=(a:Point3,b:Point3)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const raw=sub(target,shoulder),distance=Math.max(Math.abs(upper-lower)+.001,Math.min(upper+lower-.001,length(raw))),dir:Point3=length(raw)>.00001?raw.map(v=>v/length(raw)) as Point3:[0,-1,0];
 const towardsPole=sub(pole,shoulder),projection=dot(towardsPole,dir);let bend=towardsPole.map((v,i)=>v-dir[i]*projection) as Point3;
 if(length(bend)<.00001){const reference:Point3=Math.abs(dir[1])<.9?[0,1,0]:[1,0,0];const p=dot(reference,dir);bend=reference.map((v,i)=>v-dir[i]*p) as Point3}
 const norm=length(bend);bend=bend.map(v=>v/norm) as Point3;
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),out=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {elbow:shoulder.map((v,i)=>v+dir[i]*along+bend[i]*out) as Point3,wrist:shoulder.map((v,i)=>v+dir[i]*distance) as Point3};
}

export type PresenterPose='gather'|'welcome'|'open'|'left'|'right';
export type PoseBlend=Record<PresenterPose,number>;
/** Authored anticipation, gesture, hold and settle phases inspired by the supplied reference. */
export function presenterChoreography(time:number,topic:string):PoseBlend{
 const cycle=Math.floor(Math.max(0,time)/13.6),phase=Math.max(0,time)%13.6,compare=topic==='compare';
 const lead:PresenterPose=cycle%2===0?'left':'right',follow:PresenterPose=lead==='left'?'right':'left';
 const keys:[number,PresenterPose][]=[[0,cycle===0?'welcome':'gather'],[.8,cycle===0?'welcome':'gather'],[1.8,'open'],[3.5,'open'],[4.8,'gather'],[5.9,compare?'open':lead],[7.5,compare?'open':lead],[8.8,compare?'open':follow],[10.2,compare?'open':follow],[11.7,'gather'],[13.6,'gather']];
 let i=0;while(i<keys.length-2&&phase>=keys[i+1][0])i++;
 const t=Math.max(0,Math.min(1,(phase-keys[i][0])/(keys[i+1][0]-keys[i][0]))),ease=t*t*t*(t*(t*6-15)+10);
 const pose:PoseBlend={gather:0,welcome:0,open:0,left:0,right:0};pose[keys[i][1]]+=1-ease;pose[keys[i+1][1]]+=ease;return pose;
}
