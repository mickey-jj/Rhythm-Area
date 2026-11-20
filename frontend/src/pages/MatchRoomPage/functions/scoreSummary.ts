export function chartWins(rows:readonly {aValue:string|null;bValue:string|null}[],higherWins:boolean,side:0|1,initialWinsA=0,winsRequired=Infinity):number {
 const result=rows.reduce((state,row)=>{
  if(state.stopped||state.a>=winsRequired||state.b>=winsRequired)return state;
  if(row.aValue===null||row.bValue===null)return Number.isFinite(winsRequired)?{...state,stopped:true}:state;
  const a=Number(row.aValue),b=Number(row.bValue);
  return {a:state.a+(a!==b&&(a>b)===higherWins?1:0),b:state.b+(a!==b&&(b>a)===higherWins?1:0),stopped:false};
 },{a:initialWinsA,b:0,stopped:false});
 return side===0?result.a:result.b;
}
