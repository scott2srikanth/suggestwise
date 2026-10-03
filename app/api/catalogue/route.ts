import {listRecords} from '@/lib/catalogue-server';
import {normalizeCar} from '@/lib/car-import';
import {apiError} from '@/lib/admin-auth';
export async function GET(){try{return Response.json({cars:(await listRecords()).map(normalizeCar)},{headers:{'Cache-Control':'no-store'}})}catch(e){return apiError(e)}}
