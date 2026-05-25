/** ISO tarihi "x dk önce" gibi Türkçe göreli metne çevirir. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "az önce";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} gün önce`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} ay önce`;
  return `${Math.floor(month / 12)} yıl önce`;
}
