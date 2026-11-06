import {readdir,readFile} from 'node:fs/promises';
const roots=['src','api','lib','docs','.github'];
const files=['.gitignore','.env.example','index.html','package.json','vercel.json','README.md','server.mjs','PixelifySans-OFL.txt','game.js','test.mjs','animation.test.mjs','daily.test.mjs'];
async function walk(root){for(const entry of await readdir(root,{withFileTypes:true})){const file=root+'/'+entry.name;if(entry.isDirectory())await walk(file);else files.push(file);}}
for(const root of roots)await walk(root);
for(const name of await readdir('assets'))if(name.endsWith('.png'))files.push('assets/'+name);
for(const name of ['export.mjs','build-site.mjs','content.mjs','public-files.mjs','check-browser.mjs'])files.push('scripts/'+name);
export const publicFiles=[...new Set(files)].sort();
export async function auditPublicFiles(){
 for(const file of publicFiles){if(file.endsWith('.png'))continue;const text=await readFile(file,'utf8');if(/\/Users\/[^/\s]+|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{24,}|-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(text))throw Error('Public-file audit rejected '+file);}
 return publicFiles;
}
if(process.argv[1]?.endsWith('public-files.mjs'))console.log(JSON.stringify(await auditPublicFiles(),null,2));
