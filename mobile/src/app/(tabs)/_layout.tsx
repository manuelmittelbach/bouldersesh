import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { Mountain, MessageCircle, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavItem, navBarStyle } from '@/components/BottomNav';

// Custom Tab-Navigation (login-first, hinter dem Root-Gate). expo-router/ui statt
// NativeTabs, damit die DS-BottomNav gerendert wird: TabSlot = aktiver Screen, TabList =
// die gestylte Bar, jeder TabTrigger reicht via asChild den isFocused-Status ans NavItem.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList style={navBarStyle(insets.bottom)}>
        <TabTrigger name="index" href="/" asChild>
          <NavItem icon={Mountain} label="Sessions" />
        </TabTrigger>
        <TabTrigger name="chats" href="/chats" asChild>
          <NavItem icon={MessageCircle} label="Chats" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <NavItem icon={User} label="Profile" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
