import { requireChatGPTUser } from '../chatgpt-auth';
import AdminDashboard from './admin-dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Admin — Catalogue, JSON Import & Image Upload | CARWISE',description:'Manage car data, review sources, import JSON and upload vehicle images.'};
export default async function Page(){await requireChatGPTUser('/admin');return <AdminDashboard/>}
