/**
 * Read a local image File as a data URL for in-app preview/storage (no server upload).
 */
export function readLocalImage(
  file: File | undefined,
): Promise<string | undefined> {
  if (!file || !file.type.startsWith("image/")) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export function isLocalMediaUrl(src: string | undefined | null): boolean {
  if (!src) return false;
  return src.startsWith("data:") || src.startsWith("blob:");
}
