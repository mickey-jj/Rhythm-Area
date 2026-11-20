import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi, useRefresh } from "../../../api/client";
import { GetEventsByIdAPI } from "../../../apis/events/GetEventsByIdAPI";
import { GetEventsByIdPoolAPI } from "../../../apis/events/GetEventsByIdPoolAPI";
import { GetLibraryAPI } from "../../../apis/events/GetLibraryAPI";
import { PutEventsByIdPoolAPI } from "../../../apis/events/PutEventsByIdPoolAPI";
import { useInstance } from "../../../app/InstanceContext";
import { assignCharts, assignmentsFromCharts, queryCharts, removeFromPool, type ChartAssignment, type ChartSort } from "../../../domain/library";
import { configuredPools, defaultRoles, poolPurpose, updateChartAccess, type Disclosure, type SelectionAccess } from "../functions/poolRules";

export function usePoolSelection() {
  const instance = useInstance();
  const navigate = useNavigate();
  const id = instance.event?.id;
  const event = useApi(new GetEventsByIdAPI(id),!!id && instance.isOwner);
  const pool = useApi(new GetEventsByIdPoolAPI(id),!!id && instance.isOwner);
  const library = useApi(new GetLibraryAPI(event.data?.rules.gameKey ?? ""),!!event.data && instance.isOwner);
  const refresh = useRefresh();
  const [draft,setDraft] = useState<{ assignments:ChartAssignment[]; version:number; saved:string;past:ChartAssignment[][] } | null>(null);
  const [target,setTarget] = useState(instance.event?.rules.draft[0]?.pool ?? "main");
  const [customPools,setCustomPools] = useState<string[]>([]);
  const [newPool,setNewPool] = useState("");
  const [properties,setProperties]=useState(false);
  const [previewKey,setPreviewKey]=useState<string|null>(null);
  const [selected,setSelected] = useState<string[]>([]);
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState<ChartSort>("level-desc");
  const [scope,setScope] = useState<"all"|"assigned"|"unassigned"|"target">("target");
  const [difficulty,setDifficulty] = useState("");
  const [minimum,setMinimum] = useState("");
  const [maximum,setMaximum] = useState("");
  const [pageSize,setPageSize]=useState(24);
  const [page,setPage] = useState(1);
  const [busy,setBusy] = useState(false);
  const saving = useRef(false);
  const [error,setError] = useState<unknown>(null);
  const [notice,setNotice] = useState("");
  const [destination,setDestination] = useState<string | null>(null);
  useEffect(()=>{if (!draft && event.data && pool.data) { const assignments=assignmentsFromCharts(pool.data).map(a=>a.roles.length ? a : {...a,roles:[...new Set(a.pools.flatMap(p=>defaultRoles(p,event.data!.rules)))]});setDraft({assignments,version:event.data.version,saved:JSON.stringify(assignments),past:[]}); }},[draft,event.data,pool.data]);
  const assignments = draft?.assignments ?? [];
  const dirty = !!draft && JSON.stringify(assignments)!==draft.saved;
  useEffect(()=>{if (!dirty) return;const prevent=(e:BeforeUnloadEvent)=>{e.preventDefault();};window.addEventListener("beforeunload",prevent);return()=>window.removeEventListener("beforeunload",prevent);},[dirty]);
  useEffect(()=>{
    if (!dirty) return;
    const intercept=(e:MouseEvent)=>{
      if(e.defaultPrevented || e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const link=e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if(!link || link.target==="_blank" || link.hasAttribute("download")) return;
      const url=new URL(link.href);
      if(url.origin!==location.origin || url.pathname===location.pathname && url.search===location.search) return;
      e.preventDefault();setDestination(url.pathname+url.search+url.hash);
    };
    document.addEventListener("click",intercept,true);
    return()=>document.removeEventListener("click",intercept,true);
  },[dirty]);
  const byKey = new Map(assignments.map(a=>[a.chartKey,a]));
  const metadata = new Map((library.data ?? []).map(c=>[c.chart_key,c]));
  const rows = useMemo(()=>[...(library.data ?? []),...(pool.data ?? []).filter(c=>!metadata.has(c.chart_key))],[library.data,pool.data]);
  const filtered = useMemo(()=>queryCharts(rows,{search,sort,difficulty,minimum,maximum}).filter(c=>scope==="all" || scope==="assigned" && byKey.has(c.chart_key) || scope==="unassigned" && !byKey.has(c.chart_key) || scope==="target" && byKey.get(c.chart_key)?.pools.includes(target)),[rows,search,sort,difficulty,minimum,maximum,scope,target,assignments]);
  const pages = Math.max(1,Math.ceil(filtered.length/pageSize));
  const activePage = Math.min(page,pages);
  const visible = filtered.slice((activePage-1)*pageSize,activePage*pageSize);
  const pools = configuredPools(event.data?.rules,assignments,customPools);
  useEffect(()=>{if(event.data && !pools.includes(target))setTarget(pools[0]);},[event.data,pools.join("|"),target]);
  const targetCount=assignments.filter(a=>a.pools.includes(target)).length;
  const selectedAssigned=selected.filter(key=>byKey.has(key));
  const preview=rows.find(c=>c.chart_key===previewKey);
  function changeAssignments(next: ChartAssignment[]) { if (draft) { setDraft({...draft,assignments:next,past:[...draft.past.slice(-19),draft.assignments]});setNotice("");setError(null); } }
  function toggle(key:string) { setSelected(current=>current.includes(key) ? current.filter(k=>k!==key) : [...current,key]); }
  function assign(keys:readonly string[]=selected,to=target) {
    if(poolPurpose(to,event.data?.rules)!=="match" && keys.some(key=>byKey.get(key)?.roles.includes("mystery"))){setError(new Error("隐藏原创曲仅用于裁判安排的正式曲目"));return;}
    const next=assignCharts(assignments,keys,to,defaultRoles(to,event.data?.rules)).map(a=>a.roles.includes("mystery") ? {...a,roles:a.roles.filter(r=>r!=="ban" && r!=="pick" && r!=="fixed" && r!=="qualifier")} : a);
    changeAssignments(next);setSelected([]);
  }
  function remove(keys:readonly string[]=selected) { changeAssignments(removeFromPool(assignments,keys,target));setSelected([]); }
  function applyAccess(disclosure:Disclosure,access:SelectionAccess) {
    const selectedRows=assignments.filter(a=>selected.includes(a.chartKey));
    const fixed=(event.data?.rules.stages ?? []).flatMap(s=>(s.plan?.playOrder ?? event.data!.rules.playOrder).filter(p=>p.source.startsWith("fixed:")).map(p=>p.source.slice(6)));
    if(disclosure==="hidden" && selectedRows.some(a=>a.pools.some(p=>poolPurpose(p,event.data?.rules)!=="match") || fixed.includes(a.chartKey))) {setError(new Error("排名赛、加赛和固定演奏曲目应保持公开"));return;}
    if(access==="all" && (disclosure==="hidden" || disclosure==="keep" && selectedRows.some(a=>a.roles.includes("mystery")))) {setError(new Error("隐藏原创曲只能由裁判安排"));return;}
    changeAssignments(updateChartAccess(assignments,selectedAssigned,disclosure,access));setProperties(false);setNotice("曲目设置已更新，保存图池后生效");
  }
  function undo(){if(draft?.past.length){setDraft({...draft,assignments:draft.past[draft.past.length-1],past:draft.past.slice(0,-1)});setError(null);setNotice("已撤销上一步");}}
  function selectPage(){const keys=visible.map(c=>c.chart_key);setSelected(current=>keys.every(k=>current.includes(k)) ? current.filter(k=>!keys.includes(k)) : [...new Set([...current,...keys])]);}
  function selectFiltered(){setSelected(current=>[...new Set([...current,...filtered.map(c=>c.chart_key)])]);}
  function resetFilters(){setSearch("");setDifficulty("");setMinimum("");setMaximum("");setPage(1);}

  function addPool() { const value=newPool.trim();if(!value || value.includes("|") || value.length>80) {setError(new Error("图池名称须为 1–80 字，不能包含 |"));return;}setCustomPools(current=>[...new Set([...current,value])]);setTarget(value);setNewPool(""); }
  function drop(key:string,to:string) { if (rows.some(c=>c.chart_key===key)) assign(selected.includes(key) ? selected : [key],to); }
  async function save() {
    if (!id || !draft || saving.current) return false;
    saving.current=true;setBusy(true);setError(null);
    const snapshot=assignments;
    return await new PutEventsByIdPoolAPI(id,{expectedVersion:draft.version,assignments:snapshot}).send().then(async result=>{
      setDraft({assignments:snapshot,version:result.version,saved:JSON.stringify(snapshot),past:draft.past});setNotice(`已保存 v${result.version}`);await refresh();
      return true;
    }).catch(problem=>{setError(problem);return false;}).finally(()=>{saving.current=false;setBusy(false);});
  }
  function closeNavigation(){if(!saving.current)setDestination(null);}
  async function leave(saveFirst:boolean){if(!destination || saving.current)return;const path=destination;if(!saveFirst || await save()){setDestination(null);navigate(path);}}
  return {pageSize,setPageSize, instance,event,pool,library,rows,assignments,byKey,draft,target,setTarget,pools,customPools,newPool,setNewPool,addPool,targetCount,properties,setProperties,preview,setPreviewKey,selectedAssigned,selected,setSelected,toggle,assign,remove,applyAccess,undo,selectPage,selectFiltered,resetFilters,drop,search,setSearch,sort,setSort,scope,setScope,difficulty,setDifficulty,minimum,setMinimum,maximum,setMaximum,difficulties:[...new Set(rows.map(c=>c.difficulty_label))].toSorted(),filtered,visible,page:activePage,pages,setPage,dirty,busy,error,notice,save,destination,closeNavigation,leave };
}
