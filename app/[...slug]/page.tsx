import Carwise from '../carwise';
import {cars} from '@/lib/cars';
import type {Metadata} from 'next';
type Props={params:Promise<{slug:string[]}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const car=cars.find(c=>c.model.toLowerCase().replaceAll(' ','-')===slug[2]);return {title:car?`${car.brand} ${car.model} ${car.variant} — Scorecard | CARWISE`:`${slug[0].replaceAll('-',' ')} | CARWISE`,description:car?`Compare the ${car.brand} ${car.model}: specifications, transparent category scores, feature availability and five-year ownership estimates. Sample data.`:'Explore cars, compare trade-offs and build your personal shortlist with CARWISE.'};}
export default async function Page({params}:Props){const {slug}=await params;const car=cars.find(c=>c.model.toLowerCase().replaceAll(' ','-')===slug[2]);return <Carwise initialView={slug[0]==='cars'&&slug.length>1?'detail':slug[0]} initialCar={car||cars[0]}/>}
