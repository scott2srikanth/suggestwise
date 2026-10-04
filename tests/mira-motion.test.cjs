const {test}=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');const {smoothValue,speechWeights,blinkAt,gestureAt,gesturePlan,expressionFor,speechEnergy,energyAt,solveArm,presenterChoreography}=require(path.join(process.env.CARWISE_CHECKS_DIR,'mira-motion.js'));
test('facial targets anticipate phonemes, crossfade and close through silence',()=>{const cues=[{seconds:.2,duration:.12,frame:1,viseme:'aa'},{seconds:.32,duration:.15,frame:3,viseme:'O'}];assert.equal(Object.keys(speechWeights(cues,0)).length,0);const mixed=speechWeights(cues,.31);assert.ok(mixed.viseme_aa>0&&mixed.viseme_O>0);assert.equal(Object.keys(speechWeights(cues,.7)).length,0);for(const value of Object.values(mixed))assert.ok(value>=0&&value<=.9)});
test('motion smoothing avoids overshoot after long inactive frames',()=>{const value=smoothValue(.2,1,9);assert.ok(value>.2&&value<1);assert.equal(smoothValue(.2,1,0),.2);assert.ok(smoothValue(.8,0,.016)<.8)});
test('blink and gestures are bounded, spaced and disabled with reduced motion',()=>{for(let t=0;t<30;t+=.03){assert.ok(blinkAt(t)>=0&&blinkAt(t)<=1);assert.ok(gestureAt(t,true)>=0&&gestureAt(t,true)<=1);assert.equal(gestureAt(t,false),0)}assert.equal(gestureAt(0,true),0);assert.equal(gestureAt(5,true),0)});

test('hands reach chest-height targets with stable bone lengths and outward elbows',()=>{
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 for(const sign of [-1,1]){const shoulder=[sign*.18,1.398,.02],target=[sign*.19,1.235,.32];const solved=solveArm(shoulder,target,[sign*.48,1.13,.1],.26,.24);assert.ok(distance(solved.wrist,target)<1e-8);assert.ok(Math.abs(distance(solved.elbow,shoulder)-.26)<1e-8);assert.ok(Math.abs(distance(solved.wrist,solved.elbow)-.24)<1e-8);assert.ok(sign*solved.elbow[0]>.18)}
 const distant=solveArm([0,0,0],[3,0,0],[0,1,0],.25,.25);assert.ok(distance([0,0,0],distant.wrist)<.5);
});
test('expressions adapt to delivery and comparison opens both hands',()=>{
 assert.ok(expressionFor('safety','auto',true,1).browInner>expressionFor('why','auto',true,1).browInner);
 assert.ok(expressionFor('why','cheerful',true,1).smile>expressionFor('why','neutral',true,1).smile);
 assert.ok(gesturePlan(2,'compare').left>.5&&gesturePlan(2,'compare').right>.5);
});
test('audio energy preserves silence and lip closures without exceeding the mouth blend budget',()=>{
 const samples=new Float32Array(200);samples.fill(.1,100);const energy=speechEnergy(samples,1000);assert.equal(energyAt(energy,.02),0);assert.ok(energyAt(energy,.12)>.8);
 const cues=[{seconds:.1,duration:.12,viseme:'aa'},{seconds:.2,duration:.1,viseme:'PP'}];assert.ok(speechWeights(cues,.2,0).viseme_PP>0);const weights=speechWeights(cues,.21,1);assert.ok(Object.values(weights).reduce((a,b)=>a+b,0)<=.950001);
});

test('reference choreography blends without jumps, holds open palms and only welcomes once',()=>{
 assert.equal(presenterChoreography(0,'shortlist').welcome,1);assert.equal(presenterChoreography(13.6,'shortlist').gather,1);assert.equal(presenterChoreography(2.5,'shortlist').open,1);
 for(let t=0;t<40;t+=.023){const a=presenterChoreography(t,'why'),b=presenterChoreography(t+.001,'why');assert.ok(Math.abs(Object.values(a).reduce((sum,v)=>sum+v,0)-1)<1e-9);for(const key of Object.keys(a)){assert.ok(a[key]>=0&&a[key]<=1);assert.ok(Math.abs(a[key]-b[key])<.01)}}
 assert.equal(presenterChoreography(6.5,'compare').open,1);assert.notEqual(presenterChoreography(6.5,'why').left,presenterChoreography(20.1,'why').left);
});
