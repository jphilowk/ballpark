export function respond(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(data));}
export async function bodyOf(req){
 const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
 if(origin){let parsed;try{parsed=new URL(origin);}catch{throw Error('Invalid request origin');}if(parsed.host!==host)throw Error('Invalid request origin');}
 if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Error('JSON request required');
 if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>8192)throw Error('Request too large');try{return JSON.parse(raw);}catch{throw Error('Invalid JSON request');}}
 let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw Error('Request too large');}
 try{return JSON.parse(raw);}catch{throw Error('Invalid JSON request');}
}
