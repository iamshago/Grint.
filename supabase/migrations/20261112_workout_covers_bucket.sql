-- « Ta photo » dans la feuille d'images d'une séance perso (planches F3 / G1 du canevas).
-- Bucket Storage public pour les photos de couverture envoyées par les utilisateurs.
-- Chaque utilisateur écrit dans un dossier à son id : <user_id>/<uuid>.jpg
-- La lecture passe par l'URL publique (bucket public) ; image_url de user_workouts garde
-- cette URL comme pour une image de la galerie. Aucune table modifiée.
-- L'app n'affiche « Ta photo » que si elle peut lire ce bucket (dernière règle ci-dessous) :
-- sans ce bucket, l'option reste masquée.
-- Appliquée le 12/11/2026 dans l'éditeur SQL Supabase (projet TrainingApp), sur le go de Florian.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workout-covers', 'workout-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "workout_covers_insert_own" on storage.objects;
create policy "workout_covers_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'workout-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "workout_covers_delete_own" on storage.objects;
create policy "workout_covers_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'workout-covers' and (storage.foldername(name))[1] = auth.uid()::text);

-- L'app vérifie que le bucket existe avant d'afficher « Ta photo » (storage.getBucket).
drop policy if exists "workout_covers_bucket_visible" on storage.buckets;
create policy "workout_covers_bucket_visible"
  on storage.buckets for select to authenticated
  using (id = 'workout-covers');
