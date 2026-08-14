import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { Mountain, MessageCircle, User } from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavItem, navBarStyle, TabBarHeightContext } from '@/components/BottomNav';
import { useChatsBadgeCount } from '@/queries/chat';

// Custom Tab-Navigation (login-first, hinter dem Root-Gate). expo-router/ui statt
// NativeTabs, damit die DS-BottomNav gerendert wird: TabSlot = aktiver Screen, TabList =
// die gestylte Bar, jeder TabTrigger reicht via asChild den isFocused-Status ans NavItem.
//
// Der „Chats"-Tab ist die persönliche Pipeline: oben meine offenen Anfragen (noch
// ohne Chat), unten die laufenden Gespräche zu bestätigten Sessions. Der Badge zählt
// die Zeilen, die Aufmerksamkeit brauchen (ungelesener Chat oder offene Beitritts-
// Anfragen) — dieselben Punkte, die man beim Öffnen des Tabs sieht.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const badge = useChatsBadgeCount();

  // Bar-Höhe messen und an die Tab-Screens reichen (TabBarHeightContext) — für
  // KeyboardStickyView-Leisten, die sonst um diese Höhe über der Tastatur schweben.
  const [tabBarHeight, setTabBarHeight] = useState(0);

  return (
    <TabBarHeightContext.Provider value={tabBarHeight}>
      <Tabs>
        <TabSlot />
        <TabList
          style={navBarStyle(insets.bottom)}
          onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}>
          <TabTrigger name="index" href="/" asChild>
            <NavItem icon={Mountain} label="Sessions" />
          </TabTrigger>
          <TabTrigger name="chats" href="/chats" asChild>
            <NavItem icon={MessageCircle} label="Chats" badge={badge} />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <NavItem icon={User} label="Profile" />
          </TabTrigger>
        </TabList>
      </Tabs>
    </TabBarHeightContext.Provider>
  );
}
