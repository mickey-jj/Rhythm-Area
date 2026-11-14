type DifficultyAppearance = { color:string; frame:string };
const swatches = {
  prpDetected:{color:"#3b82f6",frame:"border-[#3b82f6]"},prpInvaded:{color:"#ef4444",frame:"border-[#ef4444]"},prpMassive:{color:"#a855f7",frame:"border-[#a855f7]"},prpReboot:{color:"#f97316",frame:"border-[#f97316]"},
  phiEz:{color:"#10b22f",frame:"border-[#10b22f]"},phiHd:{color:"#0075b8",frame:"border-[#0075b8]"},phiIn:{color:"#cf1313",frame:"border-[#cf1313]"},phiAt:{color:"#383838",frame:"border-[#383838]"},
  rotaI:{color:"#32cd32",frame:"border-[#32cd32]"},rotaIi:{color:"#0099ff",frame:"border-[#0099ff]"},rotaIii:{color:"#ff6600",frame:"border-[#ff6600]"},rotaIv:{color:"#9400d3",frame:"border-[#9400d3]"},rotaAlpha:{color:"#b38cdb",frame:"border-[#b38cdb]"},
  arcPast:{color:"#00bfff",frame:"border-[#00bfff]"},arcPresent:{color:"#3cb371",frame:"border-[#3cb371]"},arcFuture:{color:"#c71585",frame:"border-[#c71585]"},arcEternal:{color:"#6a5acd",frame:"border-[#6a5acd]"},arcBeyond:{color:"#b22222",frame:"border-[#b22222]"},
  maiBasic:{color:"#22bb5b",frame:"border-[#22bb5b]"},maiAdvanced:{color:"#fb9c2d",frame:"border-[#fb9c2d]"},maiExpert:{color:"#f64861",frame:"border-[#f64861]"},maiMaster:{color:"#9e45e2",frame:"border-[#9e45e2]"},maiRemaster:{color:"#ba67f8",frame:"border-[#ba67f8]"},maiUtage:{color:"#ea3de8",frame:"border-[#ea3de8]"},
  chuBasic:{color:"#00a681",frame:"border-[#00a681]"},chuAdvanced:{color:"#f47900",frame:"border-[#f47900]"},chuExpert:{color:"#e92828",frame:"border-[#e92828]"},chuMaster:{color:"#891ade",frame:"border-[#891ade]"},chuUltima:{color:"#656568",frame:"border-[#656568]"},chuWorld:{color:"#0e2d38",frame:"border-[#0e2d38]"},
  unknown:{color:"#76838f",frame:"border-[#76838f]"},
} satisfies Record<string,DifficultyAppearance>;

const palettes: Record<string,Record<string,DifficultyAppearance>> = {
  "paradigm-reboot": {DETECTED:swatches.prpDetected,DET:swatches.prpDetected,INVADED:swatches.prpInvaded,IVD:swatches.prpInvaded,MASSIVE:swatches.prpMassive,MSV:swatches.prpMassive,REBOOT:swatches.prpReboot,RBT:swatches.prpReboot},
  phigros:{EZ:swatches.phiEz,HD:swatches.phiHd,IN:swatches.phiIn,AT:swatches.phiAt},
  rotaeno:{I:swatches.rotaI,II:swatches.rotaIi,III:swatches.rotaIii,IV:swatches.rotaIv,IVA:swatches.rotaAlpha,IVALPHA:swatches.rotaAlpha},
  arcaea:{PST:swatches.arcPast,PAST:swatches.arcPast,PRS:swatches.arcPresent,PRESENT:swatches.arcPresent,FTR:swatches.arcFuture,FUTURE:swatches.arcFuture,ETR:swatches.arcEternal,ETERNAL:swatches.arcEternal,BYD:swatches.arcBeyond,BEYOND:swatches.arcBeyond},
  "maimai-dx":{BASIC:swatches.maiBasic,ADVANCED:swatches.maiAdvanced,EXPERT:swatches.maiExpert,MASTER:swatches.maiMaster,REMASTER:swatches.maiRemaster,UTAGE:swatches.maiUtage},
  chunithm:{BASIC:swatches.chuBasic,ADVANCED:swatches.chuAdvanced,EXPERT:swatches.chuExpert,MASTER:swatches.chuMaster,ULTIMA:swatches.chuUltima,WORLDSEND:swatches.chuWorld},
};

export function difficultyAppearance(game:string,difficulty:string): DifficultyAppearance {
  const key=difficulty.normalize("NFKC").toUpperCase().replace(/[Αα]/g,"A").replace(/[\s:_\-'’]/g,"");
  return palettes[game==="maimai"?"maimai-dx":game]?.[key] ?? swatches.unknown;
}
