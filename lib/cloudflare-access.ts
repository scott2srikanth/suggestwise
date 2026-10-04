let cached:{issuer:string;expires:number;keys:JsonWebKey[]}|null=null;
function decode(value:string){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))}
export async function verifyAccess(token:string,config:Record<string,string>):Promise<string>{
 const issuer=config.ACCESS_ISSUER,audience=config.ACCESS_AUD;
 if(!issuer||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!audience)throw new Error('Access is not configured');
 const parts=token.split('.');if(parts.length!==3)throw new Error('Invalid token');
 const head=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claim=JSON.parse(new TextDecoder().decode(decode(parts[1]))),now=Math.floor(Date.now()/1000);
 if(head.alg!=='RS256'||claim.iss!==issuer||!Array.isArray(claim.aud)||!claim.aud.includes(audience)||typeof claim.exp!=='number'||claim.exp<=now||typeof claim.iat!=='number'||claim.iat>now+30||typeof claim.email!=='string'||(claim.nbf&&claim.nbf>now))throw new Error('Invalid claims');
 if(!cached||cached.issuer!==issuer||cached.expires<Date.now()||!cached.keys.some(k=>(k as JsonWebKey&{kid:string}).kid===head.kid)){const response=await fetch(issuer+'/cdn-cgi/access/certs');if(!response.ok)throw new Error('Access keys unavailable');const data=await response.json() as {keys:JsonWebKey[]};cached={issuer,keys:data.keys,expires:Date.now()+300000}}
 const jwk=cached.keys.find(k=>(k as JsonWebKey&{kid:string}).kid===head.kid);if(!jwk)throw new Error('Unknown signing key');const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Invalid signature');return claim.email.toLowerCase();
}
