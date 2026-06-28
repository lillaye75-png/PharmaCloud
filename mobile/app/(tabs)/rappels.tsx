import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useReminders } from "../../services/reminders";

export default function RappelsScreen() {
  const { reminders, add, remove, toggle } = useReminders();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");

  const handleAdd = () => {
    if (!name) return;
    add({
      id: Date.now().toString(),
      product_name: name,
      dosage,
      times: ["08:00", "20:00"],
      is_active: true,
    });
    setName("");
    setDosage("");
    setShowForm(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rappels médicaments</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput placeholder="Médicament" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Dosage (ex: 2 comprimés)" value={dosage} onChangeText={setDosage} style={styles.input} />
          <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}><Text style={{ color: "#fff", fontWeight: "600" }}>Ajouter</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reminder}>
            <View>
              <Text style={styles.reminderName}>{item.product_name}</Text>
              <Text style={styles.reminderDosage}>{item.dosage} — {item.times.join(", ")}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => toggle(item.id)}>
                <Ionicons name={item.is_active ? "alarm" : "alarm-outline"} size={22} color={item.is_active ? "#0B6E4F" : "#94A3B8"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item.id)}><Ionicons name="trash-outline" size={20} color="#DC2626" /></TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 40 }}>Aucun rappel</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFB", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#0F172A" },
  addBtn: { backgroundColor: "#0B6E4F", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 12, fontSize: 14 },
  saveBtn: { backgroundColor: "#0B6E4F", borderRadius: 12, padding: 12, alignItems: "center" },
  reminder: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reminderName: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  reminderDosage: { fontSize: 13, color: "#64748B", marginTop: 2 },
  actions: { flexDirection: "row", gap: 12, alignItems: "center" },
});
