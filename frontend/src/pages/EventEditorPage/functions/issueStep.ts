export function issueStep(path: string): number {
  const field = path.replace(/^rules\./, "");
  return /^pools|^charts/.test(field) ? 4 : /^team/.test(field) ? 5 : /^metric/.test(field) ? 3
    : /^windows\.qualifierClose/.test(field) ? 3 : /^capacity|^entryMode|^windows/.test(field) ? 1 : /^name|^description|^gameKey|^gameName|^clientVersion/.test(field) ? 0 : 3;
}
