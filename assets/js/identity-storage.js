const HISTORY='vesperion-identity-history', LAST='vesperion-identity-last-questions', LIMIT=8;
const read=(key,fallback,storage=globalThis.localStorage)=>{try{return JSON.parse(storage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;}};
export const loadIdentityHistory=(storage)=>{const value=read(HISTORY,[],storage);return Array.isArray(value)?value.slice(0,LIMIT):[];};
export function addIdentityRecord(specimen,storage=globalThis.localStorage){const history=[{id:specimen.id,name:specimen.name,rarity:specimen.rarity,at:new Date().toISOString()},...loadIdentityHistory(storage)].slice(0,LIMIT);try{storage.setItem(HISTORY,JSON.stringify(history));return{ok:true,history};}catch{return{ok:false,history:loadIdentityHistory(storage)};}}
export const loadLastQuestionIds=(storage)=>{const value=read(LAST,[],storage);return Array.isArray(value)?value.map(String):[];};
export function saveLastQuestionIds(ids,storage=globalThis.localStorage){try{storage.setItem(LAST,JSON.stringify(ids));return true;}catch{return false;}}
