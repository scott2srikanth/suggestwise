import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const saved=JSON.parse(await readFile('cloudflare.config.json','utf8'));
const id=process.env.CLOUDFLARE_D1_DATABASE_ID || saved.databaseId;if(!id||! /^[a-f0-9-]{36}$/.test(id))throw new Error('Set CLOUDFLARE_D1_DATABASE_ID to your real D1 database ID, then run npm run build:cloudflare.');
const file='dist/server/wrangler.json',config=JSON.parse(await readFile(file,'utf8'));if(config.r2_buckets?.length||config.d1_databases?.[0]?.database_id!==id)throw new Error('Rebuild with DEPLOY_TARGET=cloudflare and the correct D1 ID. R2 must be absent.');
for(const args of [['d1','migrations','apply','DB','--remote','--config',file],['deploy','--config',file]]){const result=spawnSync('npx',['wrangler',...args],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
