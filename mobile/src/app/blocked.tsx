import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar, Button, ScreenHeader } from "@/components/ui";
import { publicImageUrl } from "@/lib/images";
import { avatarTone } from "@/lib/utils";
import {
  type BlockedProfile,
  useBlockedProfiles,
  useUnblockProfile,
} from "@/queries/blocks";
import { colors } from "@/theme/colors";

// Verwaltung der ausgesprochenen Blocks (App-Store-Pflicht: ein Block muss
// zurücknehmbar sein). Erreichbar über Account → „Blocked climbers". Das geblockte
// Profil selbst ist unerreichbar (getProfile → null), darum lebt das Entblocken hier
// und nicht auf dem Profil-Screen.

function BlockedRow({ profile }: { profile: BlockedProfile }) {
  const unblock = useUnblockProfile();
  const name = profile.display_name ?? "Anonymous";

  return (
    <View className="flex-row items-center gap-3 py-3">
      <Avatar
        name={name}
        tone={avatarTone(profile.id)}
        size="sm"
        src={publicImageUrl(profile.avatar_path)}
      />
      <Text className="flex-1 font-sans-medium text-[15px] text-rock-900" numberOfLines={1}>
        {name}
      </Text>
      <Button
        variant="outline"
        size="sm"
        loading={unblock.isPending}
        onPress={() => unblock.mutate({ blockedId: profile.id })}>
        Unblock
      </Button>
    </View>
  );
}

export default function Blocked() {
  const { data: blocked, isLoading } = useBlockedProfiles();

  return (
    <SafeAreaView className="flex-1 bg-rock-25" edges={["top"]}>
      <ScreenHeader />
      <View className="px-5 pb-2">
        <Text className="font-display-bold text-[28px] leading-8 text-rock-900">
          Blocked climbers
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[500]} />
        </View>
      ) : !blocked || blocked.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans text-rock-500">
            You haven’t blocked anyone. Blocking someone hides you from each other and
            keeps you out of the same sessions.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(p) => p.id}
          contentContainerClassName="px-5 pb-10"
          ItemSeparatorComponent={() => <View className="h-px bg-rock-100" />}
          renderItem={({ item }) => <BlockedRow profile={item} />}
        />
      )}
    </SafeAreaView>
  );
}
