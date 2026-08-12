export type SpotifyArtistPayload = {
  id: string;
  name: string;
  imageUrl?: string;
  followers: number;
  genres: string[];
  externalUrl: string;
  topTracks: {
    id: string;
    name: string;
    previewUrl: string | null;
    externalUrl: string;
    albumImage?: string;
  }[];
};
