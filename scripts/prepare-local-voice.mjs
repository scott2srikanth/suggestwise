import {mkdir,cp,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const vendor=new URL('public/vendor/headtts/',root);
await mkdir(vendor,{recursive:true});
for(const name of ['headtts.mjs','worker-tts.mjs','utils.mjs','language.mjs','language-en-us.mjs'])await copyFile(new URL('node_modules/@met4citizen/headtts/modules/'+name,root),new URL(name,vendor));
await copyFile(new URL('node_modules/@met4citizen/headtts/LICENSE',root),new URL('LICENSE',vendor));
await cp(new URL('node_modules/@met4citizen/headtts/dictionaries/',root),new URL('dictionaries/',vendor),{recursive:true});
