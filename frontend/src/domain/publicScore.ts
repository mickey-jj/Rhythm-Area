export type PublicMemberScore={userId:string;displayName:string;value:string};
export type PublicScore={slotId:string;aValue:string|null;bValue:string|null;aMembers?:PublicMemberScore[];bMembers?:PublicMemberScore[]};
