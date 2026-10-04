import { env } from 'cloudflare:workers';
import { cars as demos, type Car } from './cars';
import {carSchema,normalizeCar,toCarData,type CarData} from './car-import';
export function database(){if(!env.DB)throw new Error('Car data storage is unavailable. Please try again later.');return env.DB;}
export async function listRecords(includeDrafts=false):Promise<CarData[]>{const {workingItems,publishedStore}=await import('./suggest-store-server');const items=includeDrafts?await workingItems():(await publishedStore()).snapshot.items;return items.filter(i=>i.domain==='cars').map(i=>carSchema.parse(i.data));}
export async function loadCatalogue():Promise<{cars:Car[];error:string|null}>{try{return {cars:(await listRecords()).map(normalizeCar),error:null}}catch(error){console.error('Catalogue unavailable',error instanceof Error?error.message:'unknown');return {cars:demos,error:'Saved catalogue is temporarily unavailable. Showing the original demo catalogue; imported updates will return when storage recovers.'}}}
