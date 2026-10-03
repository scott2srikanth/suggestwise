import {requireChatGPTUser} from '../chatgpt-auth';
import {hasAdminSession,authRecord} from '@/lib/admin-security';
import AdminDashboard from './admin-dashboard';
import AdminLogin from './admin-login';
export const dynamic='force-dynamic';
export const metadata={title:'Admin — Catalogue, JSON Import & Image Upload | CARWISE',description:'Manage car data, review sources, import JSON and upload vehicle images.'};
export default async function Page(){const user=await requireChatGPTUser('/admin');try{const record=await authRecord();if(record&&record.owner_id!==user.userId)return <main className="admin-main"><h1>Administrator access only</h1><p>This account is not the enrolled administrator.</p></main>;if(await hasAdminSession(user.userId))return <AdminDashboard/>;return <AdminLogin enabled={!!record?.enabled}/>}catch{return <main className="admin-main"><h1>Admin temporarily unavailable</h1><p>Please try again shortly. The dashboard remains locked.</p></main>}}
