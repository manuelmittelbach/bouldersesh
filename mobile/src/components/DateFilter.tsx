import { Calendar as CalendarIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { Chip } from '@/components/ui';
import { formatDayChip, startOfDay, toDateKey } from '@/lib/utils';
import { colors } from '@/theme/colors';

// Der Tag-Filter: feste Chips für heute/morgen, plus ein Kalender für die restlichen Tage
// des 7-Tage-Fensters (weiter kann keine Session liegen — der Create-Flow lässt nur
// heute+6 zu). Wird ein ferner Tag gewählt, erscheint ein dynamischer dritter Chip.
// Geteilt zwischen Home-Feed und Create-Screen, damit die Tagauswahl überall gleich aussieht.
export function DateFilter({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(today.getDate() + 1);
  const maxDate = startOfDay(new Date());
  maxDate.setDate(today.getDate() + 6);

  const isToday = selected.toDateString() === today.toDateString();
  const isTomorrow = selected.toDateString() === tomorrow.toDateString();
  const isFar = !isToday && !isTomorrow;

  function pickFromCalendar(dateString: string) {
    // dateString ist lokales "YYYY-MM-DD" — als lokale Mitternacht parsen (nicht new
    // Date(str), das UTC annähme und die Zeitzone verschieben könnte).
    const [y, m, d] = dateString.split('-').map(Number);
    onSelect(new Date(y, m - 1, d));
    setCalendarOpen(false);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4">
        <Chip active={isToday} onPress={() => onSelect(today)}>
          Today
        </Chip>
        <Chip active={isTomorrow} onPress={() => onSelect(tomorrow)}>
          Tomorrow
        </Chip>
        {isFar ? (
          <Chip active onPress={() => setCalendarOpen(true)}>
            {formatDayChip(selected)}
          </Chip>
        ) : null}
        <Chip
          active={false}
          className="w-11 justify-center px-0"
          onPress={() => setCalendarOpen(true)}
          icon={
            <CalendarIcon
              size={17}
              color={isFar ? colors.brand[600] : colors.rock[700]}
              strokeWidth={2}
            />
          }
        />
      </ScrollView>

      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center bg-rock-950/40 px-6"
          onPress={() => setCalendarOpen(false)}>
          {/* Inneres Pressable fängt Taps ab, damit ein Klick auf den Kalender selbst
              das Modal nicht schließt. */}
          <Pressable className="w-full max-w-sm overflow-hidden rounded-2xl bg-rock-0 p-2">
            <Calendar
              minDate={toDateKey(today)}
              maxDate={toDateKey(maxDate)}
              current={toDateKey(selected)}
              markedDates={{ [toDateKey(selected)]: { selected: true } }}
              onDayPress={(day) => pickFromCalendar(day.dateString)}
              disableAllTouchEventsForDisabledDays
              hideExtraDays
              firstDay={1}
              theme={{
                calendarBackground: colors.rock[0],
                textSectionTitleColor: colors.rock[500],
                monthTextColor: colors.rock[900],
                dayTextColor: colors.rock[900],
                textDisabledColor: colors.rock[300],
                todayTextColor: colors.brand[600],
                selectedDayBackgroundColor: colors.brand[500],
                selectedDayTextColor: colors.rock[0],
                arrowColor: colors.brand[600],
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
