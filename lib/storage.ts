// lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'matchTips';

// Speichert einen Tipp für ein bestimmtes Spiel in AsyncStorage
export async function saveTip(matchId: string, homeGoals: number, awayGoals: number, matchData?: any) {
  try {
    console.log('Speichere Tipp:', matchId, homeGoals, awayGoals, matchData);
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : {};
    parsed[matchId] = { homeGoals, awayGoals, match: matchData };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    console.log('Gespeicherte Daten:', parsed);
  } catch (e) {
    console.error("Fehler beim Speichern des Tipps:", e);
  }
}

// Lädt einen gespeicherten Tipp für ein bestimmtes Spiel
export async function getTip(matchId: string): Promise<{ homeGoals: number; awayGoals: number } | null> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    console.log('Geladene Daten für getTip:', existing);
    if (!existing) return null;
    const parsed = JSON.parse(existing);
    console.log('Tipp für', matchId, ':', parsed[matchId]);
    return parsed[matchId] || null;
  } catch (e) {
    console.error("Fehler beim Laden des Tipps:", e);
    return null;
  }
}

// Lädt alle gespeicherten Tipps als Objekt
export async function getAllTips(): Promise<{ [matchId: string]: { homeGoals: number; awayGoals: number } }> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    console.log('Geladene Daten für getAllTips:', existing);
    if (!existing) return {};
    return JSON.parse(existing);
  } catch (e) {
    console.error("Fehler beim Laden aller Tipps:", e);
    return {};
  }
}

// Löscht alle gespeicherten Tipps
export async function clearAllTips() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('Alle Tipps wurden gelöscht.');
  } catch (e) {
    console.error('Fehler beim Löschen aller Tipps:', e);
  }
}
