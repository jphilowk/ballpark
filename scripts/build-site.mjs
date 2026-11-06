import {mkdir,readFile,writeFile,copyFile,readdir,rm} from 'node:fs/promises';
await rm('public',{recursive:true,force:true});await mkdir('public/src',{recursive:true});await mkdir('public/assets',{recursive:true});
for(const file of ['index.html','src/ballpark.js','src/ballpark.css','PixelifySans-OFL.txt'])await copyFile(file,'public/'+file);
const source=await readFile('src/ballpark.js','utf8');
const names=[...new Set([...source.matchAll(/\.\/assets\/([A-Za-z]+)\.png/g)].map(m=>m[1]))];
for(const name of names)await copyFile('assets/'+name+'.png','public/assets/'+name+'.png');
await writeFile('public/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\n');
console.log(`Built public site with ${names.length} artwork assets; private content excluded.`);
