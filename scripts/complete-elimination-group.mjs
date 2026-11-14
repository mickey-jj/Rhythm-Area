export async function completeEliminationGroup(A,eventId,group,owner,playerForEntry){
 const room=(await A.get(`/elimination-groups/${group.id}`,owner)).data;
 for(const [i,entry] of room.entries.entries()){
  const session=playerForEntry(entry.id),value=String(99-i);
  const members=group.rules.entryMode==='team'?(await A.get(`/events/${eventId}/teams`,session)).data.find(t=>t.entryId===entry.id).members:[];
  const memberScores=group.rules.entryMode==='team'?group.charts.flatMap(c=>members.slice(0,group.rules.team.perChart).map(m=>({slotId:c.chart_key,userId:m.id,value}))):null;
  await A.post(`/events/${eventId}/attempts`,{entryId:entry.id,matchId:null,groupId:group.id,items:members.length?[]:group.charts.map(c=>({slotId:c.chart_key,value})),memberScores,evidenceNote:'多人晋级轮隔离测试'},session);
 }
 for(const attempt of (await A.get(`/events/${eventId}/attempts`,owner)).data.filter(a=>a.groupId===group.id&&a.status==='pending'))await A.post(`/attempts/${attempt.id}/review`,{decision:'approved',reason:'共同曲目成绩核对通过'},owner);
 const current=(await A.get(`/elimination-groups/${group.id}`,owner)).data;
 return(await A.post(`/elimination-groups/${group.id}/finalize`,{expectedVersion:current.group.version,order:current.standings.map(s=>s.entryId),reason:''},owner)).data;
}
