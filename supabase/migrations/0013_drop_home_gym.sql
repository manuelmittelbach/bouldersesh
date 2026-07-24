-- home_gym_id entfällt.
--
-- Das Feld sollte die Stamm-Halle einer Person halten, wurde aber nie befüllt und
-- nirgends gelesen. Die räumliche Verortung liegt woanders: die aktive Stadt ist
-- eine Geräte-Präferenz (useActiveCity, ADR-0002), die Halle wählt man pro Session.
-- Ein Profil-Feld dafür gibt es bewusst nicht mehr.
--
-- Zum Zeitpunkt der Migration: 2 Profile, keins mit gesetztem home_gym_id — kein
-- Datenverlust. Das Droppen entfernt zugleich den FK auf gyms.
alter table public.profiles
  drop column if exists home_gym_id;
