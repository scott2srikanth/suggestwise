import {publishedStore} from '@/lib/suggest-store-server';
import {database} from '@/lib/catalogue-server';
import {snapshotDelta,type StoreSnapshot} from '@/lib/suggest-store-schema';
import {apiError} from '@/lib/admin-auth';
export async function GET(request:Request){try{const current=await publishedStore(),etag='"'+current.hash+'"',headers={'ETag':etag,'Cache-Control':'private, no-cache','Vary':'Cookie'};if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers});const since=new URL(request.url).searchParams.get('since');if(since){const old=await database().prepare('SELECT data_json FROM store_releases WHERE id=?').bind(since).first<{data_json:string}>();if(old)return Response.json({version:current.version,hash:current.hash,updatedAt:current.updatedAt,baseVersion:since,delta:snapshotDelta(JSON.parse(old.data_json) as StoreSnapshot,current.snapshot)}, {headers});}return Response.json(current,{headers});}catch(e){return apiError(e)}}
