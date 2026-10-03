import { env } from 'cloudflare:workers';
import { cars as demos, type Car } from './cars';
import {carSchema,normalizeCar,toCarData,type CarData} from './car-import';
export function database(){if(!env.DB)throw new Error('Car data storage is unavailable. Please try again later.');return env.DB;}
export function bucket(){const bindings=env as unknown as {BUCKET?:R2Bucket};if(!bindings.BUCKET)throw new Error('Image storage is unavailable. Please try again later.');return bindings.BUCKET;}
export async function listRecords(includeDrafts=false):Promise<CarData[]>{const db=database();const {results}=await db.prepare('SELECT id, data_json, published FROM catalogue ORDER BY updated_at DESC').all<{id:string;data_json:string;published:number}>();const merged=new Map(demos.map(c=>[c.id,toCarData(c)]));for(const row of results){const record=carSchema.parse(JSON.parse(row.data_json));merged.set(row.id,record)}return [...merged.values()].filter(r=>includeDrafts||r.status==='published');}
export async function loadCatalogue():Promise<{cars:Car[];error:string|null}>{try{return {cars:(await listRecords()).map(normalizeCar),error:null}}catch(error){console.error('Catalogue unavailable',error instanceof Error?error.message:'unknown');return {cars:demos,error:'Saved catalogue is temporarily unavailable. Showing the original demo catalogue; imported updates will return when storage recovers.'}}}
