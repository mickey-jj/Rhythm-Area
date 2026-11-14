export function selectedValue<const T extends readonly string[]>(values: T, value: string): T[number] {
  const selected = values.find(item => item === value);
  if (selected === undefined) throw new Error("不支持的选项");
  return selected;
}
