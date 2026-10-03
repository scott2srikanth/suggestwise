import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {database} from './catalogue-server';
import {encodeBase32,hashToken} from './totp';
export const sessionCookie='carwise_admin_session';
export type AuthRecord={id:string;owner_id:string;secret:string;enabled:number;pending_until:number;last_counter:number;attempts:number;attempt_until:number};
export async function authRecord(){return database().prepare("SELECT * FROM admin_auth WHERE id='primary'").first<AuthRecord>()}
async function encryptionKey(){const raw=(env as unknown as Record<string,string>).ADMIN_TOTP_ENCRYPTION_KEY;if(!raw||!/^[a-f0-9]{64}$/.test(raw))throw new Error('Authenticator encryption is not configured');return crypto.subtle.importKey('raw',new Uint8Array(raw.match(/../g)!.map(x=>parseInt(x,16))),{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function encryptSecret(secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(),new TextEncoder().encode(secret)));return JSON.stringify({iv:Array.from(iv),data:Array.from(data)})}
export async function decryptSecret(value:string){const {iv,data}=JSON.parse(value);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(iv)},await encryptionKey(),new Uint8Array(data)))}
export function newSecret(){return encodeBase32(crypto.getRandomValues(new Uint8Array(20)))}
export async function hasAdminSession(userId:string){const token=(await cookies()).get(sessionCookie)?.value;if(!token||! /^[a-f0-9]{64}$/.test(token))return false;const record=await database().prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND owner_id=? AND expires_at>?').bind(await hashToken(token),userId,Date.now()).first();return !!record}
export async function issueSession(userId:string,request:Request){const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');await database().prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(Date.now()).run();await database().prepare('INSERT INTO admin_sessions(token_hash,owner_id,expires_at) VALUES(?,?,?)').bind(await hashToken(token),userId,Date.now()+30*60*1000).run();return `${sessionCookie}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1800${new URL(request.url).protocol==='https:'?'; Secure':''}`}
