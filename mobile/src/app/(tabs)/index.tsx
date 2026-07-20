import { router } from 'expo-router';
import { Mountain, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { Button, IconButton } from '@/components/ui';
import { avatarTone, formatDateShort, formatSessionTime, gradeBand } from '@/lib/utils';
import { useOpenSessions, type SessionWithMeta } from '@/queries/sessions';
import { colors } from '@/theme/colors';

// Der Feed: offene Sessions als SessionCard-Liste. Header mit Datum-Eyebrow + „Who's climbing?".
// FAB unten rechts (der EINE Brand-Glow der View) führt ins Anlegen-Formular.
function Header() {
  return (
    <View className="pb-3 pt-2">
      <Text className="font-sans-semibold text-[11px] uppercase tracking-[0.08em] text-rock-500">
        {formatDateShort(new Date())}
      </Text>
      <Text className="mt-1 font-display-bold text-[30px] leading-none text-rock-900">
        Who's climbing?
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center px-6 py-16">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Mountain size={28} color={colors.brand[600]} strokeWidth={2} />
      </View>
      <Text className="font-display text-base text-rock-900">No sessions yet</Text>
      <Text className="mb-4 mt-1 text-center font-sans text-sm text-rock-500">
        Be the first to head to the wall today.
      </Text>
      <Button
        variant="primary"
        icon={<Plus size={16} color={colors.rock[0]} strokeWidth={2.5} />}
        onPress={() => router.push('/sessions/new')}>
        Create session
      </Button>
    </View>
  );
}

export default function Dashboard() {
  const { data: sessions, isLoading, error, refetch } = useOpenSessions();
  // Eigener Pull-Zustand: der RefreshControl-Spinner soll NUR bei echtem Runterziehen
  // laufen, nicht bei jedem Hintergrund-Refetch (refetchOnMount).
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={['top']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[500]} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-sans text-sm text-danger">
            Couldn’t load: {(error as Error).message}
          </Text>
        </View>
      ) : (
        <FlatList<SessionWithMeta>
          data={sessions ?? []}
          keyExtractor={(s) => s.id}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerClassName="px-5 pb-8 gap-3"
          ListHeaderComponent={Header}
          ListEmptyComponent={EmptyState}
          renderItem={({ item }) => {
            const name = item.creator?.display_name ?? 'Anonymous';
            const gymLabel = item.gym
              ? item.gym.city
                ? `${item.gym.name} · ${item.gym.city}`
                : item.gym.name
              : undefined;
            return (
              <SessionCard
                name={name}
                avatarTone={avatarTone(item.creator?.id ?? name)}
                grade={item.level}
                band={gradeBand(item.creator?.skill_level)}
                time={formatSessionTime(item.starts_at)}
                gym={gymLabel}
                note={item.note}
                onPress={() => router.push(`/sessions/${item.id}`)}
              />
            );
          }}
        />
      )}

      {/* FAB — der eine Brand-Glow pro View. */}
      <View className="absolute bottom-6 right-5">
        <IconButton
          variant="brand"
          size="lg"
          label="Create session"
          className="h-14 w-14 shadow-brand"
          onPress={() => router.push('/sessions/new')}>
          <Plus size={26} color={colors.rock[0]} strokeWidth={2.5} />
        </IconButton>
      </View>
    </SafeAreaView>
  );
}
