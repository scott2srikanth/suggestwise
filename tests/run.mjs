import { build } from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const temp=await mkdtemp(join(tmpdir(),'carwise-tests-'));
try{await build({entryPoints:['lib/car-import.ts','lib/ownership.ts'],bundle:true,platform:'node',format:'cjs',outdir:temp,logLevel:'silent'});const result=spawnSync(process.execPath,['--test','tests/import-ownership.test.cjs'],{stdio:'inherit',env:{...process.env,CARWISE_CHECKS_DIR:temp}});process.exitCode=result.status??1;}finally{await rm(temp,{recursive:true,force:true})}
