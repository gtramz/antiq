import { ArtistProfile } from "@/modules/artists/artist-profile";

export default function ArtistPage({
  params,
}: {
  params: { id: string };
}) {
  return <ArtistProfile artistId={params.id} />;
}
