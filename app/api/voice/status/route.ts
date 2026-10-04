import {requirePrivateOwner,apiError} from '@/lib/admin-auth';
import {voiceConfig} from '@/lib/voice-server';
export async function GET(request:Request){try{await requirePrivateOwner(request);return Response.json({configured:!!await voiceConfig()},{headers:{'Cache-Control':'no-store'}})}catch(e){return apiError(e)}}
