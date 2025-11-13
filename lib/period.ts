export const ymd = (d: Date) => d.toISOString().slice(0,10);
export const todayISO = () => ymd(new Date());

// Monday start
export function startOfWeekISO(dateStr: string) {
  const d = new Date(dateStr);
  const day = (d.getDay()+6)%7; // Mon=0
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return ymd(d);
}
export function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
export function yearKey(dateStr: string) {
  return String(new Date(dateStr).getFullYear());
}
