export function chartWins(rows:readonly {aValue:string|null;bValue:string|null}[],higherWins:boolean,side:0|1,initialWinsA=0):number {
 return rows.reduce((wins,row)=>row.aValue!==null&&row.bValue!==null&&Number(row.aValue)!==Number(row.bValue)&&((Number(row.aValue)>Number(row.bValue))===higherWins)===(side===0)?wins+1:wins,side===0?initialWinsA:0);
}
