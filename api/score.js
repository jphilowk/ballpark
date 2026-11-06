import {loadBank,scoreQuestion} from '../lib/daily.mjs';
import {respond,bodyOf} from '../lib/http.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 try{return respond(res,200,scoreQuestion(loadBank(),await bodyOf(req)));}catch{return respond(res,400,{error:'That swing could not be saved. Please try again or refresh.'});}
}
