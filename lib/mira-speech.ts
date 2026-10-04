export const MIRA_VOICE='en-IN-NeerjaNeural';
export type MiraEmotion='auto'|'neutral'|'cheerful'|'empathetic';
export type VisemeCue={seconds:number;id:number};
export function escapeSSML(text:string){return text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!))}
export function emotionFor(topic:string,emotion:MiraEmotion){if(emotion==='cheerful'||emotion==='empathetic')return emotion;if(emotion==='neutral')return null;return ['safety','tradeoffs'].includes(topic)?'empathetic':'cheerful'}
export function miraSSML(text:string,topic:string,emotion:MiraEmotion='auto',rate=1){const style=emotionFor(topic,emotion);const body=`<prosody rate="${Math.round((Math.min(1.15,Math.max(.85,rate))-1)*100)}%">${escapeSSML(text)}</prosody>`;return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${MIRA_VOICE}">${style?`<mstts:express-as style="${style}" styledegree="1">${body}</mstts:express-as>`:body}</voice></speak>`}
// Six drawn poses follow Azure's phoneme/viseme groups; timing comes from audio, never a looping animation.
export function mouthFrame(id:number){if(!Number.isInteger(id)||id<0||id>21)return 0;if(id===0||id===21)return 0;if([1,2,9,11].includes(id))return 1;if([3,8].includes(id))return 3;if([4,7,10].includes(id))return 4;if(id===18)return 5;return 2}
export function cueAt(cues:VisemeCue[],seconds:number){let lo=0,hi=cues.length-1,answer=0;while(lo<=hi){const mid=(lo+hi)>>1;if(cues[mid].seconds<=seconds){answer=cues[mid].id;lo=mid+1}else hi=mid-1}return mouthFrame(answer)}
