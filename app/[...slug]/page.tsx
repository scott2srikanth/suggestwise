import Carwise from '../carwise';
import {carPath} from '@/lib/cars';
import {loadCatalogue} from '@/lib/catalogue-server';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string[]}>};
const pages=['cars','top-20','compare','find-my-car','decision-engine','ownership','shortlist','profile','price','guides'];
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const {cars}=await loadCatalogue();const car=cars.find(c=>carPath(c)==='/'+slug.join('/'));return {title:car?`${car.brand} ${car.model} ${car.variant} — Scorecard | CARWISE`:`${slug[0].replaceAll('-',' ')} | CARWISE`,description:car?`Compare the ${car.brand} ${car.model}: specifications, transparent category scores, feature availability and ownership estimates.`:'Explore cars, compare trade-offs and build your personal shortlist with CARWISE.'};}
export default async function Page({params}:Props){const {slug}=await params;const data=await loadCatalogue();const car=data.cars.find(c=>carPath(c)==='/'+slug.join('/'));if(slug.length>1&&!car||!pages.includes(slug[0]))notFound();return <Carwise initialView={car?'detail':slug[0]} initialCar={car} initialCars={data.cars} catalogueError={data.error}/>}
