import { build } from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const temp=await mkdtemp(join(tmpdir(),'carwise-tests-'));
try{await build({entryPoints:['lib/car-import.ts','lib/ownership.ts','lib/totp.ts','lib/decision-engine.ts','lib/guide-narration.ts','lib/mira-speech.ts','lib/mira-motion.ts','lib/scenario-narration.ts'],bundle:true,platform:'node',format:'cjs',outdir:temp,logLevel:'silent'});const result=spawnSync(process.execPath,['--test','tests/import-ownership.test.cjs','tests/totp.test.cjs','tests/decision-engine.test.cjs','tests/guide-narration.test.cjs','tests/mira-speech.test.cjs','tests/mira-motion.test.cjs','tests/scenario-narration.test.cjs'],{stdio:'inherit',env:{...process.env,CARWISE_CHECKS_DIR:temp}});process.exitCode=result.status??1;if(!process.exitCode){const storage=spawnSync(process.execPath,['tests/store-integration.mjs'],{stdio:'inherit'});process.exitCode=storage.status??1;}}finally{await rm(temp,{recursive:true,force:true})}
