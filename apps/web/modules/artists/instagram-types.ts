export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type InstagramMediaItem = {
  id: string;
  mediaType: InstagramMediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink: string;
  caption?: string;
};

export type InstagramProfilePayload = {
  username: string;
  name?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  mediaCount?: number;
  externalUrl: string;
  media: InstagramMediaItem[];
};
