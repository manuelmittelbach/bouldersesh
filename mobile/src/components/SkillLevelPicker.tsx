import { View } from 'react-native';

import { Chip } from '@/components/ui';
import { gradeBand, SKILL_LABEL, SKILL_LEVELS } from '@/lib/utils';
import type { SkillLevel } from '@/types/database';

// Gemeinsamer Skill-Level-Picker (Onboarding + Profil-Tab). Die Chips füllen per
// `grow basis-[45%]` immer zu zweit eine Zeile (2×2 bei vier Leveln) — so bricht
// je nach Gerätebreite kein einzelner Chip verloren in die zweite Zeile, und
// beide Screens sehen identisch aus.
//
// `allowDeselect`: erneutes Tippen auf den aktiven Chip wählt ab (Onboarding,
// wo das Niveau optional bleibt) — im Profil-Tab bleibt immer eines gewählt.

type SkillLevelPickerProps = {
  value: SkillLevel | null;
  onChange: (value: SkillLevel | null) => void;
  allowDeselect?: boolean;
};

export function SkillLevelPicker({ value, onChange, allowDeselect = false }: SkillLevelPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {SKILL_LEVELS.map((lvl) => (
        <Chip
          key={lvl}
          active={value === lvl}
          band={gradeBand(lvl)}
          className="grow basis-[45%] justify-center"
          onPress={() => onChange(allowDeselect && value === lvl ? null : lvl)}>
          {SKILL_LABEL[lvl]}
        </Chip>
      ))}
    </View>
  );
}
