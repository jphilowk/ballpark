import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {validateBank,SPORTS} from '../lib/daily.mjs';
const command=process.argv[2]||'check';
const file=process.env.BALLPARK_BANK_FILE||'private/bank.json';
const bank=validateBank(JSON.parse(await readFile(file,'utf8')));
const hash=createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex');
const option=name=>process.argv[process.argv.indexOf(name)+1];
if(command==='review'){
 const rows=bank.questions.map((q,i)=>`| ${i+1} | ${q.sport} | ${q.q.replaceAll('|','\\|')} | ${q.answer} ${q.unit} | [${q.source}](${q.url}) | ${q.status} |`);
 const review=`# Ballpark — first two weeks\n\n70 candidate questions, one per sport per day. These are researched drafts; none is scheduled or approved yet. Dates are assigned only after review. Keep this file private: it contains future answers.\n\nReview hash: \`${hash}\`\n\n| # | Sport | Question | Answer | Source | Status |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`;
 await mkdir('private',{recursive:true});await writeFile('private/questions-review.md',review);console.log(`Private review prepared: ${bank.questions.length} questions. Hash ${hash}`);
}else if(command==='approve'){
 if(option('--reviewed-hash')!==hash||!process.argv.includes('--reviewed-hash')||!process.argv.includes('--start')||!process.argv.includes('--reviewer'))throw Error('Approval requires the exact reviewed hash, start date, and reviewer.');
 const start=option('--start'),reviewer=option('--reviewer');if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw Error('Use an explicit YYYY-MM-DD launch date');
 const pools=SPORTS.map(sport=>bank.questions.filter(q=>q.sport===sport&&q.status==='verified'));
 if(pools.some(pool=>pool.length!==14))throw Error('First reserve must contain exactly 14 verified questions per sport');
 const approvedAt=new Date().toISOString();
 for(let day=0;day<14;day++){
  const date=new Date(start+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+day);const dateKey=date.toISOString().slice(0,10),qs=pools.map(pool=>pool[day]);
  for(const q of qs){q.status='approved';q.approvedBy=reviewer;q.approvedAt=approvedAt;bank.ledger.push({factId:q.factId,date:dateKey});}
  bank.schedule.push({date:dateKey,ids:qs.map(q=>q.id)});
 }
 validateBank(bank);await writeFile(file,JSON.stringify(bank,null,2)+'\n');console.log('Approved and scheduled 14 daily puzzles in the private bank.');
}else if(command==='pack'){
 const packed=gzipSync(JSON.stringify(bank)).toString('base64');if(Buffer.byteLength(packed)>50000)throw Error('Bank is approaching the environment size limit; archive old text or migrate storage.');
 await mkdir('private',{recursive:true});await writeFile('private/bank.env','BALLPARK_BANK_GZIP_BASE64='+packed+'\n');console.log(`Packed private bank: ${packed.length} bytes, ${bank.schedule.length} scheduled days. Value written privately, never printed.`);
}else if(command==='check')console.log(`Valid bank: ${bank.questions.length} questions; ${bank.schedule.length} scheduled dates; ${bank.ledger.length} reserved facts.`);
else throw Error('Unknown content command');
