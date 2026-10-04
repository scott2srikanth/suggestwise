'use client';
import {useMemo,useState,type ComponentProps} from 'react';
import DecisionEngine from './decision-engine';
import CategoryMira from './category-mira';
import {suggestRecords,suggestScore,type Domain} from '@/lib/suggest-catalogue';
export default function MiraHub(props:ComponentProps<typeof DecisionEngine>){const [domain,setDomain]=useState<'cars'|Domain>('cars');const weights=useMemo(()=>[20,20,20,20,20],[]);const records=useMemo(()=>suggestRecords.filter(r=>r.domain===domain).sort((a,b)=>(suggestScore(b,weights)||0)-(suggestScore(a,weights)||0)||a.id.localeCompare(b.id)),[domain,weights]);return <div className="mira-hub"><nav className="mira-domains" aria-label="Mira decision category">{[['cars','Cars'],['travel','Travel & dining'],['homes','Hyderabad homes'],['education','Hyderabad education']].map(([id,label])=><button key={id} className={domain===id?'active':''} aria-pressed={domain===id} onClick={()=>setDomain(id as typeof domain)}>{label}</button>)}</nav>{domain==='cars'?<DecisionEngine {...props}/>:<CategoryMira key={domain} domain={domain} records={records} weights={weights}/>}</div>}
