import type { PastRelease } from "./release-card";

/** Past releases for portfolio Discography tab (no funding metrics). */
export const pastReleases: PastRelease[] = [
  {
    id: "r-vale-sierra",
    artistId: "a-vale",
    title: "Sierra Letters",
    format: "Album",
    year: 2022,
    seed: "r-vale-sierra",
    coverUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#01050A", a: "#0A2038", b: "#030A12", c: "#5B9DFF" },
  },
  {
    id: "r-vale-kitchen",
    artistId: "a-vale",
    title: "Kitchen Table",
    format: "EP",
    year: 2021,
    seed: "r-vale-kitchen",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#000208", a: "#0E2440", b: "#050C18", c: "#2A6BB0" },
  },
  {
    id: "r-vale-dust",
    artistId: "a-vale",
    title: "Dust Road",
    format: "Single",
    year: 2020,
    seed: "r-vale-dust",
    coverUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#000000", a: "#122848", b: "#06101C", c: "#3D7EFF" },
  },
  {
    id: "r-vale-nylon",
    artistId: "a-vale",
    title: "Nylon Nights",
    format: "EP",
    year: 2019,
    seed: "r-vale-nylon",
    coverUrl:
      "https://images.unsplash.com/photo-1514320291840-75f0a710d6df?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#01050A", a: "#163050", b: "#081420", c: "#4A8FD4" },
  },
  {
    id: "r-nero-ashes",
    artistId: "a-nero",
    title: "Ashes & Transfers",
    format: "Album",
    year: 2023,
    seed: "r-nero-ashes",
    coverUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#000000", a: "#122848", b: "#06101C", c: "#3D7EFF" },
  },
  {
    id: "r-nero-transfer",
    artistId: "a-nero",
    title: "Transfer 04",
    format: "Single",
    year: 2022,
    seed: "r-nero-transfer",
    coverUrl:
      "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#000000", a: "#163050", b: "#081420", c: "#4A8FD4" },
  },
  {
    id: "r-iria-ventana",
    artistId: "a-iria",
    title: "Ventana",
    format: "EP",
    year: 2023,
    seed: "r-iria-ventana",
    coverUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#000000", a: "#163050", b: "#081420", c: "#4A8FD4" },
  },
  {
    id: "r-iria-marea",
    artistId: "a-iria",
    title: "Marea Alta",
    format: "Album",
    year: 2021,
    seed: "r-iria-marea",
    coverUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    palette: { bg: "#00040A", a: "#0C1A30", b: "#040810", c: "#2563A8" },
  },
];

export function releasesForArtist(artistId: string): PastRelease[] {
  return pastReleases.filter((r) => r.artistId === artistId);
}
