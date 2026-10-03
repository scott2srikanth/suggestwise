import Carwise from './carwise';
import {loadCatalogue} from '@/lib/catalogue-server';
export const dynamic='force-dynamic';
export default async function Page(){const data=await loadCatalogue();return <Carwise initialCars={data.cars} catalogueError={data.error}/>}
