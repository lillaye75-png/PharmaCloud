import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" options={{ headerShown: true, title: "Connexion" }} />
        <Stack.Screen name="auth/register" options={{ headerShown: true, title: "Inscription" }} />
      </Stack>
    </>
  );
}
