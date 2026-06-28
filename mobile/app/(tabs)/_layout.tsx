import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#0B6E4F" }}>
      <Tabs.Screen name="home" options={{ title: "Accueil", tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="boutique" options={{ title: "Boutique", tabBarIcon: ({ color }) => <Ionicons name="storefront" size={24} color={color} /> }} />
      <Tabs.Screen name="rappels" options={{ title: "Rappels", tabBarIcon: ({ color }) => <Ionicons name="alarm" size={24} color={color} /> }} />
      <Tabs.Screen name="commandes" options={{ title: "Commandes", tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} /> }} />
      <Tabs.Screen name="ia-assistant" options={{ title: "Assistant IA", tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses" size={24} color={color} /> }} />
    </Tabs>
  );
}
