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

export type SpotifyAlbumType = "album" | "single" | "ep" | "compilation";

export type SpotifyRelease = {
  id: string;
  name: string;
  albumType: SpotifyAlbumType;
  releaseDate: string;
  externalUrl: string;
  imageUrl?: string;
  totalTracks: number;
};

export type SpotifyAlbumsPayload = {
  artistId: string;
  releases: SpotifyRelease[];
};
