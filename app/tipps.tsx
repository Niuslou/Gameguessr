import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { fetchMatchById } from "../api/footballApi";


interface Tip {
  home: string;
  away: string;
}

interface TipWithMatch {
  id: string;
  tip: Tip;
  match: any;
}

export default function TippOverview() {
  const [tipps, setTipps] = useState<TipWithMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    setLoading(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const tipKeys = allKeys.filter((key) => key.startsWith("tip_"));

      const entries = await Promise.all(
        tipKeys.map(async (key) => {
          const value = await AsyncStorage.getItem(key);
          const matchId = key.replace("tip_", "");
          const match = await fetchMatchById(matchId);
          return {
            id: matchId,
            tip: value ? JSON.parse(value) : null,
            match,
          };
        })
      );

      const sorted = entries.sort((a, b) =>
        new Date(a.match.utcDate).getTime() - new Date(b.match.utcDate).getTime()
      );

      setTipps(sorted);
    } catch (err) {
      console.error("Fehler beim Laden der Tipps", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Deine Tipps</Text>
      {tipps.length === 0 ? (
        <Text>Keine Tipps gefunden.</Text>
      ) : (
        tipps.map(({ id, tip, match }) => {
          const date = new Date(match.utcDate);
          const finished = match.status === "FINISHED";
          const correct =
            finished &&
            tip.home === String(match.score.fullTime.home) &&
            tip.away === String(match.score.fullTime.away);

          return (
            <View key={id} style={styles.tipBox}>
              <Text style={styles.teams}>
                {match.homeTeam.name} vs. {match.awayTeam.name}
              </Text>
              <Text style={styles.date}>{date.toLocaleString()}</Text>
              <Text style={styles.tip}>
                Dein Tipp: {tip.home} : {tip.away}
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
