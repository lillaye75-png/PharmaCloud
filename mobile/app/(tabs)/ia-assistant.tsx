import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour ! Je suis PharmIA. Posez-moi vos questions sur les médicaments." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Je suis un assistant de démonstration. Connectez la clé API Claude pour des réponses réelles." }]);
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#0B6E4F" />
        <Text style={styles.title}>PharmIA</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        style={styles.chat}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.bubbleText, item.role === "user" && { color: "#fff" }]}>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput value={input} onChangeText={setInput} placeholder="Posez votre question..." style={styles.input} />
        <TouchableOpacity onPress={send} style={styles.sendBtn}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFB" },
  header: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderBottomWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", color: "#0B6E4F" },
  chat: { flex: 1, padding: 16 },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12, marginBottom: 8 },
  userBubble: { backgroundColor: "#0B6E4F", alignSelf: "flex-end" },
  assistantBubble: { backgroundColor: "#fff", alignSelf: "flex-start", borderWidth: 1, borderColor: "#E2E8F0" },
  bubbleText: { fontSize: 14, color: "#0F172A" },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff" },
  input: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: "#0B6E4F", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
