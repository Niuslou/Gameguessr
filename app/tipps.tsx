import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { clearAllTips, getAllTips } from "../lib/storage";


interface Tip {
  homeGoals: number;
  awayGoals: number;
  match?: any; // optional gespeichertes Match
}

interface TipWithMatch {
  id: string;
  tip: Tip;
  match: any;
}

export default function TippOverview() {
  const [tipps, setTipps] = useState<TipWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  useFocusEffect(
    useCallback(() => {
      loadTips();
    }, [])
  );

  const loadTips = async () => {
    setLoading(true);
    try {
      const allTips = await getAllTips();
      console.log('DEBUG Tippübersicht: allTips', allTips);
      const entries = Object.entries(allTips).map(([matchId, tip]) => {
        return tip.match ? { id: matchId, tip, match: tip.match } : null;
      });
      const filtered = entries.filter((entry): entry is TipWithMatch => entry !== null && entry !== undefined && entry.match);
      const sorted = filtered.sort((a, b) =>
        new Date(b.match.utcDate).getTime() - new Date(a.match.utcDate).getTime()
      );
      setTipps(sorted);
    } catch (err) {
      console.error("Fehler beim Laden der Tipps", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearAllTips();
    setTipps([]);
  };

  // Statistik berechnen
  const total = tipps.length;
  const exact = tipps.filter(({ match, tip }) =>
    match.status === "FINISHED" &&
    tip.homeGoals === match.score.fullTime.home &&
    tip.awayGoals === match.score.fullTime.away
  ).length;
  const finished = tipps.filter(({ match }) => match.status === "FINISHED").length;
  const wrong = finished - exact;
  const open = total - finished;

  // Tendenz richtig: Gewinner (oder Unentschieden) stimmt, aber nicht das exakte Ergebnis
  const tendency = tipps.filter(({ match, tip }) => {
    if (match.status !== "FINISHED") return false;
    const realDiff = match.score.fullTime.home - match.score.fullTime.away;
    const tipDiff = tip.homeGoals - tip.awayGoals;
    // Exakt richtig zählt nicht als Tendenz
    if (tip.homeGoals === match.score.fullTime.home && tip.awayGoals === match.score.fullTime.away) return false;
    // Beide Unentschieden
    if (realDiff === 0 && tipDiff === 0) return true;
    // Beide Heimsieg
    if (realDiff > 0 && tipDiff > 0) return true;
    // Beide Auswärtssieg
    if (realDiff < 0 && tipDiff < 0) return true;
    return false;
  }).length;

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Deine Tipps</Text>
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Statistik</Text>
        <Text>Getippte Spiele: {total}</Text>
        <Text>Exakt richtig: {exact}</Text>
        <Text>Sieger richtig: {tendency}</Text>
        <Text>Falsch: {wrong}</Text>
        <Text>Offen: {open}</Text>
      </View>
      <Button title="Alle Tipps löschen" onPress={handleClear} />
      {tipps.length === 0 ? (
        <Text>Keine Tipps gefunden.</Text>
      ) : (
        <>
          {tipps.slice(0, visibleCount).map(({ id, tip, match }) => {
            const date = new Date(match.utcDate);
            const finished = match.status === "FINISHED";
            const correct =
              finished &&
              tip.homeGoals === match.score.fullTime.home &&
              tip.awayGoals === match.score.fullTime.away;

            return (
              <View key={id} style={styles.tipBox}>
                <Text style={styles.teams}>
                  {match.homeTeam.name} vs. {match.awayTeam.name}
                </Text>
                <Text style={styles.date}>{date.toLocaleString()}</Text>
                <Text style={styles.tip}>
                  Dein Tipp: {tip.homeGoals} : {tip.awayGoals}
                </Text>
                {finished ? (
                  <Text style={styles.result}>
                    Ergebnis: {match.score.fullTime.home} :{" "}
                    {match.score.fullTime.away}{" "}
                    {correct ? "✅" : "❌"}
                  </Text>
                ) : (
                  <Text style={{ color: "#888" }}>Spiel noch nicht gespielt</Text>
                )}
              </View>
            );
          })}
          {visibleCount < tipps.length && (
            <Button
              title="Mehr anzeigen ▼"
              onPress={() => setVisibleCount((c) => c + 5)}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  statsBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  statsTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  tipBox: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
  },
  teams: {
    fontWeight: "bold",
    fontSize: 16,
  },
  date: {
    color: "#666",
    marginBottom: 6,
  },
  tip: {
    marginTop: 4,
  },
  result: {
    marginTop: 4,
    fontWeight: "bold",
  },
});
