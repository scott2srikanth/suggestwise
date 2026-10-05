import type {Object3D} from 'three';
/** Reference-inspired shoulder-length groom, attached to the existing head bone. */
export function addMiraHair(T:typeof import('three'),head:Object3D){
 const group=new T.Group();group.name='Mira shoulder length side-part hair';
 const dark=new T.MeshStandardMaterial({color:'#201b1b',roughness:.62,metalness:0});
 const highlight=new T.MeshStandardMaterial({color:'#302724',roughness:.7,metalness:0});
 const cap=new T.Mesh(new T.SphereGeometry(1,32,24),dark);cap.position.set(0,1.699,-.027);cap.scale.set(.104,.116,.091);group.add(cap);
 function lock(points:number[][],radius:number,index:number){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const segments=32,sides=8,frames=curve.computeFrenetFrames(segments,false),positions:number[]=[],indices:number[]=[];
 for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPointAt(t),r=radius*(1-.9*Math.pow(t,5));for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.55);positions.push(v.x,v.y,v.z);if(i<segments&&j<sides){const q=i*(sides+1)+j;indices.push(q,q+sides+1,q+1,q+1,q+sides+1,q+sides+2)}}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,index%7===0?highlight:dark);mesh.name='Mira wavy hair lock';group.add(mesh);}
 // Back volume follows the head and falls just above the shoulders.
 for(let i=0;i<34;i++){const a=Math.PI*(i/33),x=Math.cos(a)*.099,z=-.03-Math.sin(a)*.075;lock([[x*.45,1.79,z*.5],[x,1.71,z],[x*1.08,1.60,z-.01],[x*1.2+Math.sin(i)*.008,1.48,z+.008],[x*1.28,1.385+(i%5)*.008,z+.025]],.016,i)}
 // Swept crown: side part, asymmetric face-framing waves, no fringe across the eyes.
 for(const side of [-1,1])for(let i=0;i<16;i++){const depth=i/15,startX=.038+(depth-.5)*.012;lock([[startX,1.803-depth*.009,-.005-depth*.045],[side*.067,1.782-depth*.02,.048-depth*.07],[side*(.105+depth*.012),1.69,.064-depth*.06],[side*(.115+depth*.019),1.59,.068-depth*.065],[side*(.13+depth*.016),1.49,.065-depth*.055],[side*(.12+depth*.028),1.40+(i%4)*.012,.08-depth*.065]],.0125,34+i+(side===1?16:0))}
 // Author in model rest coordinates, then attach without losing the bone transform.
 head.updateWorldMatrix(true,false);const inverse=new T.Matrix4().copy(head.matrixWorld).invert();for(const child of group.children)child.applyMatrix4(inverse);head.add(group);return group;
}
