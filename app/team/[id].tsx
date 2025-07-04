// app/team/[id].tsx

import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { fetchTeamById, fetchTeamMatches } from "../../api/footballApi";
import { getTip, saveTip } from "../../lib/storage";

export default function TeamDetails() {
    const { id } = useLocalSearchParams();
    const [team, setTeam] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [tips, setTips] = useState<Record<string, { homeGoals: number; awayGoals: number }>>({});
    const [inputValues, setInputValues] = useState<Record<string, { home: string; away: string }>>({});
    const [loading, setLoading] = useState(true); // Neuer Ladezustand
    const [error, setError] = useState<string | null>(null); // Neuer Fehlerzustand

    // Funktion zum Laden der Team- und Spieldaten
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (id) {
                const teamData = await fetchTeamById(String(id));
                setTeam(teamData);
                const matchData = await fetchTeamMatches(String(id));
                setMatches(matchData);

                // Laden der bereits gespeicherten Tipps
                const loadedTips: Record<string, { homeGoals: number; awayGoals: number }> = {};
                for (const match of matchData) {
                    const saved = await getTip(match.id.toString());
                    if (saved) {
                        loadedTips[match.id.toString()] = saved;
                    }
                }
                setTips(loadedTips);
            }
        } catch (err) {
            console.error("Fehler beim Laden der Teamdetails:", err);
            setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]); // Abhängigkeit von loadData

    const handleTipChange = (matchId: string, teamType: "home" | "away", value: string) => {
        setInputValues((prev) => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [teamType]: value,
            },
        }));
    };

    const submitTip = async (matchId: string) => {
        const input = inputValues[matchId];
        if (!input || input.home === "" || input.away === "") {
            Alert.alert("Tipp speichern fehlgeschlagen", "Bitte gib für beide Teams Tore ein.");
            return;
        }

        const homeGoals = Number(input.home);
        const awayGoals = Number(input.away);

        if (isNaN(homeGoals) || isNaN(awayGoals) || homeGoals < 0 || awayGoals < 0) {
            Alert.alert("Fehler", "Bitte gib gültige positive Zahlen für Tore ein.");
            return;
        }

        const match = matches.find((m) => m.id.toString() === matchId);
        if (!match) {
            // Tipp speichern, aber kein Alert mehr anzeigen
            await saveTip(matchId, homeGoals, awayGoals, null);
        } else {
            await saveTip(matchId, homeGoals, awayGoals, match);
            // Kein Alert mehr nach erfolgreichem Speichern
        }

        setTips((prev) => ({
            ...prev,
            [matchId]: { homeGoals: homeGoals, awayGoals: awayGoals }
        }));
        // Optional: Reset input fields after saving
        // setInputValues(prev => {
        //   const newValues = { ...prev };
        //   delete newValues[matchId];
        //   return newValues;
        // });
    };

    // Lade- und Fehlerzustände
    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3949ab" />
                <Text style={styles.loadingText}>Lade Teamdaten und Spiele...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                    <Text style={styles.retryButtonText}>Erneut versuchen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Wenn Teamdaten geladen wurden, aber kein Team gefunden wurde (z.B. falsche ID)
    if (!team) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>Team nicht gefunden.</Text>
            </View>
        );
    }

    const now = new Date();

    const pastMatches = matches
        .filter((m) => new Date(m.utcDate) < now && m.status === "FINISHED")
        .slice(-5) // Letzte 5
        .reverse(); // Neuestes zuerst

    const upcomingMatches = matches
        .filter((m) => new Date(m.utcDate) >= now)
        .slice(0, 5); // Nächste 5

    return (
        <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            enableOnAndroid={true}
            extraScrollHeight={200}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>{team.name}</Text>

            {/* Letzte 5 Spiele */}
            <Text style={styles.sectionTitle}>Letzte 5 Spiele</Text>
            <View style={styles.sectionContent}>
                {pastMatches.length > 0 ? (
                    pastMatches.map((match) => (
                        <View key={match.id} style={styles.matchCard}>
                            <Text style={styles.matchDate}>
                                {new Date(match.utcDate).toLocaleDateString()}
                            </Text>
                            <Text style={styles.matchTeams}>
                                <Text style={styles.homeTeamText}>{match.homeTeam.name}</Text>
                                <Text style={styles.scoreText}> {match.score.fullTime.home} : {match.score.fullTime.away} </Text>
                                <Text style={styles.awayTeamText}>{match.awayTeam.name}</Text>
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>Keine vergangenen Spiele gefunden.</Text>
                )}
            </View>

            {/* Nächste 5 Spiele (mit Tippfunktion) */}
            <Text style={styles.sectionTitle}>Nächste 5 Spiele</Text>
            <View style={styles.sectionContent}>
                {upcomingMatches.length > 0 ? (
                    upcomingMatches.map((match) => {
                        const matchId = match.id.toString();
                        const savedTip = tips[matchId];
                        const displayHomeGoals = inputValues[matchId]?.home !== undefined ? inputValues[matchId].home : (savedTip ? savedTip.homeGoals.toString() : '');
                        const displayAwayGoals = inputValues[matchId]?.away !== undefined ? inputValues[matchId].away : (savedTip ? savedTip.awayGoals.toString() : '');


                        return (
                            <View
                                key={match.id}
                                style={styles.tipMatchCard}
                                collapsable={false}
                            >
                                <Text style={styles.upcomingMatchTime}>
                                    {new Date(match.utcDate).toLocaleDateString()} –{" "}
                                    {new Date(match.utcDate).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Text>
                                <Text style={styles.upcomingMatchTeams}>
                                    <Text style={styles.homeTeamText}>{match.homeTeam.name}</Text> vs. <Text style={styles.awayTeamText}>{match.awayTeam.name}</Text>
                                </Text>

                                <View style={styles.inputRow}>
                                    <TextInput
                                        placeholder="Heim"
                                        keyboardType="numeric"
                                        value={displayHomeGoals}
                                        onChangeText={(text) => handleTipChange(matchId, "home", text)}
                                        style={styles.input}
                                        placeholderTextColor="#9e9e9e"
                                    />
                                    <Text style={styles.inputSeparator}>:</Text>
                                    <TextInput
                                        placeholder="Gast"
                                        keyboardType="numeric"
                                        value={displayAwayGoals}
                                        onChangeText={(text) => handleTipChange(matchId, "away", text)}
                                        style={styles.input}
                                        placeholderTextColor="#9e9e9e"
                                    />
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={() => submitTip(matchId)}
                                    >
                                        <Text style={styles.saveButtonText}>Speichern</Text>
                                    </TouchableOpacity>
                                </View>
                                {savedTip && (
                                    <Text style={styles.savedTip}>
                                        Dein Tipp: {savedTip.homeGoals} : {savedTip.awayGoals} ✅
                                    </Text>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noDataText}>Keine bevorstehenden Spiele gefunden.</Text>
                )}
            </View>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f4f6fa", // Heller Hintergrund
        minHeight: '100%', // Füllt den ganzen Bildschirm
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#f4f6fa",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#607d8b',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#3949ab',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 30, // Größerer Titel
        fontWeight: "bold",
        marginBottom: 25,
        textAlign: "center",
        color: '#1a237e', // Dunkleres Blau
        letterSpacing: 1,
        paddingTop: 10, // Etwas mehr Abstand nach oben
    },
    sectionTitle: {
        fontSize: 20, // Größerer Abschnittstitel
        fontWeight: "bold",
        marginTop: 25, // Mehr Abstand nach oben
        marginBottom: 15, // Mehr Abstand nach unten
        color: '#3949ab', // Blauer Farbton
        textAlign: 'center',
        borderBottomWidth: 1, // Eine Linie darunter
        borderBottomColor: '#e0e0e0',
        paddingBottom: 8,
    },
    sectionContent: {
        marginBottom: 20, // Abstand zwischen den Sektionen
    },
    matchCard: {
        backgroundColor: "#fff",
        padding: 15,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e8eaf6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'center', // Zentriert den Inhalt
    },
    tipMatchCard: { // Etwas anderer Stil für Tipp-Karten
        backgroundColor: "#fff",
        padding: 18,
        marginVertical: 8,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#c5cae9', // Leicht dunklerer Rand
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    matchDate: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 5,
    },
    matchTeams: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#263238',
        textAlign: 'center',
        flexWrap: 'wrap', // Teams können umbrechen
    },
    homeTeamText: {
        color: '#1a237e', // Dunkleres Blau für Heimteam
    },
    awayTeamText: {
        color: '#424242', // Standard Dunkelgrau für Gastteam
    },
    scoreText: {
        color: '#388e3c', // Grün für das Ergebnis
        fontWeight: 'bold',
        marginHorizontal: 5,
    },
    upcomingMatchTime: {
        fontSize: 15,
        color: '#757575',
        marginBottom: 8,
        textAlign: 'center',
    },
    upcomingMatchTeams: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#263238',
        marginBottom: 12,
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center', // Zentriert die Eingabefelder und den Trenner
        marginVertical: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#a7b8e1", // Leichter blauer Rand
        backgroundColor: '#eef1f9', // Heller Hintergrund für Input
        paddingVertical: 8,
        paddingHorizontal: 12,
        width: 60, // Etwas breiter
        textAlign: "center",
        borderRadius: 8, // Stärker abgerundet
        fontSize: 16,
        color: '#37474f',
    },
    inputSeparator: {
        marginHorizontal: 10, // Mehr Abstand
        fontSize: 18,
        fontWeight: 'bold',
        color: '#616161',
    },
    saveButton: {
        backgroundColor: '#42a5f5', // Schöner blauer Button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginLeft: 15, // Abstand zum letzten Inputfeld
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    savedTip: {
        marginTop: 10,
        fontStyle: "italic",
        fontSize: 14,
        color: '#2e7d32', // Dunkleres Grün
        textAlign: 'center',
        fontWeight: '500',
    },
    noDataText: {
        textAlign: 'center',
        color: '#90a4ae',
        fontSize: 16,
        marginVertical: 10,
        paddingHorizontal: 20,
    }
});