// lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'matchTips';

export async function saveTip(matchId: string, homeGoals: number, awayGoals: number) {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : {};
    parsed[matchId] = { homeGoals, awayGoals };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error("Fehler beim Speichern des Tipps:", e);
  }
}

export async function getTip(matchId: string): Promise<{ homeGoals: number; awayGoals: number } | null> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) return null;
    const parsed = JSON.parse(existing);
    return parsed[matchId] || null;
  } catch (e) {
    console.error("Fehler beim Laden des Tipps:", e);
    return null;
  }
}
