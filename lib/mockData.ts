import type { Confession, RankInfo } from "@/types";

/** Ana sayfada gösterilen örnek (sahte) itiraflar. */
export const mockConfessions: Confession[] = [
  {
    id: "1",
    content:
      "Herkese mutlu göründüğümü sanıyorlar ama aslında aylardır kimseye söyleyemediğim bir boşluk hissediyorum. Burada yazmak bile rahatlattı.",
    alias: "gece_kuşu",
    gender: "other",
    rank: "Sırdaş",
    likes: 1243,
    comments: 87,
    createdAt: "2 saat önce",
    tags: ["#itiraf", "#duygular"],
  },
  {
    id: "2",
    content:
      "En yakın arkadaşıma yıllar önce yaptığım bir şeyi hâlâ itiraf edemedim. Belki bir gün cesaret bulurum, şimdilik sadece buraya bırakıyorum.",
    alias: "sessiz_fırtına",
    gender: "female",
    rank: "Gizemli",
    likes: 2980,
    comments: 214,
    createdAt: "5 saat önce",
    tags: ["#pişmanlık", "#dostluk"],
    isPlus: true,
  },
  {
    id: "3",
    content:
      "Bugün tanımadığım birine yardım ettim ve karşılığında hiçbir şey beklemedim. İlk kez kendimle bu kadar gurur duydum.",
    alias: "anonim_47",
    gender: "male",
    rank: "Efsane",
    likes: 5621,
    comments: 333,
    createdAt: "1 gün önce",
    tags: ["#iyilik", "#motivasyon"],
  },
];

/** Puan/rütbe sisteminin tanıtımı için kullanılan rütbe basamakları. */
export const ranks: RankInfo[] = [
  { rank: "Çaylak", minPoints: 0, icon: "🌱", description: "Yolculuğun başlangıcı" },
  { rank: "Sırdaş", minPoints: 500, icon: "🤫", description: "Güven kazanıyorsun" },
  { rank: "Gizemli", minPoints: 2000, icon: "🎭", description: "Toplulukta tanınıyorsun" },
  { rank: "Efsane", minPoints: 8000, icon: "🔥", description: "İtirafların konuşuluyor" },
  { rank: "Anonix Pro", minPoints: 20000, icon: "👑", description: "Zirvedekilerden birisin" },
];
