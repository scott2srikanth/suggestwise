import {bucket} from './catalogue-server';
import {encryptSecret,decryptSecret} from './admin-security';
import {ApiError} from './admin-auth';
const configKey='private-settings/mira-azure-speech';
export const speechRegions=['centralindia','southindia','westindia','eastus','eastus2','westus','westus2','westus3','centralus','northcentralus','southcentralus','westcentralus','westeurope','northeurope','uksouth','ukwest','southeastasia','eastasia','australiaeast','canadacentral','francecentral','germanywestcentral','japaneast','japanwest','koreacentral','switzerlandnorth','uaenorth','brazilsouth','southafricanorth','swedencentral'];
type VoiceConfig={region:string;key:string};
export async function voiceConfig():Promise<VoiceConfig|null>{const object=await bucket().get(configKey);if(!object)return null;const config=JSON.parse(await decryptSecret(await object.text())) as VoiceConfig;if(!speechRegions.includes(config.region)||!config.key)throw new Error('Invalid speech configuration');return config}
export async function saveVoiceConfig(config:VoiceConfig){await bucket().put(configKey,await encryptSecret(JSON.stringify(config)),{httpMetadata:{contentType:'application/json'}})}
export async function removeVoiceConfig(){await bucket().delete(configKey)}
export async function azureToken(config:VoiceConfig){const r=await fetch(`https://${config.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,{method:'POST',headers:{'Ocp-Apim-Subscription-Key':config.key},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new ApiError('Azure Speech connection failed. Check the resource key, region and subscription in admin.',502);return r.text()}
