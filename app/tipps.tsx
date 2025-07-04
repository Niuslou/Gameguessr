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
  const correct = tipps.filter(({ match, tip }) =>
    match.status === "FINISHED" &&
    tip.homeGoals === match.score.fullTime.home &&
    tip.awayGoals === match.score.fullTime.away
  ).length;
  const finished = tipps.filter(({ match }) => match.status === "FINISHED").length;
  const wrong = finished - correct;
  const open = total - finished;

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Deine Tipps</Text>
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Statistik</Text>
        <Text>Getippte Spiele: {total}</Text>
        <Text>Richtig: {correct}</Text>
        <Text>Falsch: {wrong}</Text>
        <Text>Offen: {open}</Text>
      </View>
      <Button title="Alle Tipps löschen" onPress={handleClear} />
      {tipps.length === 0 ? (
        <Text>Keine Tipps gefunden.</Text>
      ) : (
        tipps.map(({ id, tip, match }) => {
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
        })
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
