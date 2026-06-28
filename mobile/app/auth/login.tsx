import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { api } from "../../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post<{ access_token: string }>("/auth/login", { email, password });
      api.setToken(res.access_token);
      router.replace("/(tabs)/home");
    } catch (e: any) { alert(e.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Mot de passe" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity onPress={handleLogin} style={styles.btn}><Text style={styles.btnText}>Se connecter</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/auth/register")}><Text style={styles.link}>Créer un compte</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F8FAFB" },
  title: { fontSize: 28, fontWeight: "bold", color: "#0F172A", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, backgroundColor: "#fff" },
  btn: { backgroundColor: "#0B6E4F", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#0B6E4F", textAlign: "center", marginTop: 16, fontSize: 14 },
});
