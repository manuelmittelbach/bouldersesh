import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  pickAndUploadProfileImage,
  removeProfileImage,
} from "@/lib/images";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

const PROFILE_KEY = (id: string) => ["profiles", id] as const;

/** Muss zum CHECK aus 0009_profile_images.sql passen. */
export const MAX_GALLERY_PHOTOS = 6;

async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: PROFILE_KEY(id ?? ""),
    queryFn: () => getProfile(id!),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Profile> & { id: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(input)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_KEY(data.id), data);
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}

// ------------------------------------------------------------------
// Bilder
// ------------------------------------------------------------------
// Bilder speichern SOFORT beim Auswählen, nicht über den Save-Button des
// Formulars (ADR-0003) — deshalb eigene Mutations statt eines Feldes im
// Formularzustand. Reihenfolge überall gleich: hochladen → DB schreiben →
// altes File löschen. Bricht es vorher ab, zeigt das Profil noch das alte
// Bild und im Bucket liegt höchstens eine Waise.

async function writePaths(
  id: string,
  patch: Partial<Pick<Profile, "avatar_path" | "gallery_paths">>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Avatar setzen. Gibt `null` zurück, wenn die Auswahl abgebrochen wurde. */
export function useSetAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile): Promise<Profile | null> => {
      const path = await pickAndUploadProfileImage(profile.id, "avatar");
      if (!path) return null;
      const updated = await writePaths(profile.id, { avatar_path: path });
      await removeProfileImage(profile.avatar_path);
      return updated;
    },
    onSuccess: syncProfileCaches(queryClient),
  });
}

/** Avatar entfernen — zurück auf die Initialen. */
export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile): Promise<Profile> => {
      const updated = await writePaths(profile.id, { avatar_path: null });
      await removeProfileImage(profile.avatar_path);
      return updated;
    },
    onSuccess: syncProfileCaches(queryClient),
  });
}

/** Galeriefoto hinten anhängen. Umsortieren gibt es nicht (ADR-0003). */
export function useAddGalleryPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile): Promise<Profile | null> => {
      // Der CHECK in der DB hat das letzte Wort; hier abfangen heißt nur, dass
      // niemand erst ein Bild hochlädt, das die Zeile dann ablehnt.
      if (profile.gallery_paths.length >= MAX_GALLERY_PHOTOS) {
        throw new Error(`You can have up to ${MAX_GALLERY_PHOTOS} photos.`);
      }
      const path = await pickAndUploadProfileImage(profile.id, "gallery");
      if (!path) return null;
      return writePaths(profile.id, {
        gallery_paths: [...profile.gallery_paths, path],
      });
    },
    onSuccess: syncProfileCaches(queryClient),
  });
}

/** Einzelnes Galeriefoto löschen. */
export function useRemoveGalleryPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      profile,
      path,
    }: {
      profile: Profile;
      path: string;
    }): Promise<Profile> => {
      const updated = await writePaths(profile.id, {
        gallery_paths: profile.gallery_paths.filter((p) => p !== path),
      });
      await removeProfileImage(path);
      return updated;
    },
    onSuccess: syncProfileCaches(queryClient),
  });
}

// Die Mutations geben `null` zurück, wenn der Picker abgebrochen wurde — dann
// hat sich nichts geändert und es gibt nichts zu synchronisieren.
function syncProfileCaches(queryClient: ReturnType<typeof useQueryClient>) {
  return (data: Profile | null) => {
    if (!data) return;
    queryClient.setQueryData(PROFILE_KEY(data.id), data);
    queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    // Avatare hängen im Feed und in der Chat-Liste mit drin.
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["chats"] });
  };
}
