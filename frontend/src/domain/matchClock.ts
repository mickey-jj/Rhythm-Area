export type MatchTiming={draftSeconds:number;chartSeconds:number};
export type MatchClock={matchId:string;phaseKey:string;chartIndex:number;status:"ready"|"running"|"paused"|"expired"|"finished";remainingMs:number;endsAt:number|null;version:number;policy:MatchTiming};
export type MatchClockBoard={clock:MatchClock;serverNow:number;enabled:boolean;canManage:boolean};
export type ClockAction="start"|"pause"|"resume"|"next"|"restart";
