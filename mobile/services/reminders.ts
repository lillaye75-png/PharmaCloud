import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type Reminder = {
  id: string;
  product_name: string;
  dosage: string;
  times: string[];
  is_active: boolean;
};

const STORAGE_KEY = "pc_reminders";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (Platform.OS === "web") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReminders(JSON.parse(stored));
    }
  }, []);

  const save = (items: Reminder[]) => {
    setReminders(items);
    if (Platform.OS === "web") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  };

  const add = (r: Reminder) => save([...reminders, r]);
  const remove = (id: string) => save(reminders.filter((r) => r.id !== id));
  const toggle = (id: string) => save(reminders.map((r) => r.id === id ? { ...r, is_active: !r.is_active } : r));

  return { reminders, add, remove, toggle };
}
