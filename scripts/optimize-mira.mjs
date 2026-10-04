// Geometry/texture optimization of the CC0 MPFB 3D avatar, not image artwork creation.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,prune,meshopt,textureCompress} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
const source=process.argv[2];if(!source)throw new Error('Pass the original MPFB GLB path.');
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(source);
await doc.transform(dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:85}),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(new URL('../public/avatars/mira-presenter.glb',import.meta.url).pathname,doc);
