import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Button,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { PieChart } from 'react-native-chart-kit';
import { ALL_TEAMS } from '../constants/config';
import { clearAllTips, getAllTips } from "../lib/storage";


interface Tip {
    homeGoals: number;
    awayGoals: number;
    match?: any;
}

interface TipWithMatch {
    id: string;
    tip: Tip;
    match: any;
}

const screenWidth = Dimensions.get("window").width;

export default function TippOverview() {
    const [tipps, setTipps] = useState<TipWithMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(5);
    const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

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
                const match = (tip as any).match ? (tip as any).match : null;
                return { id: matchId, tip, match };
            });
            const sorted = entries.sort((a, b) => {
                const dateA = a.match && a.match.utcDate ? new Date(a.match.utcDate).getTime() : 0;
                const dateB = b.match && b.match.utcDate ? new Date(b.match.utcDate).getTime() : 0;
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return dateB - dateA;
            });
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

    const allTeams = ALL_TEAMS;

    const filteredTipps = selectedTeam === 'ALL'
        ? tipps
        : tipps.filter(({ match }) =>
            match && (match.homeTeam?.name === selectedTeam || match.awayTeam?.name === selectedTeam)
        );

    const total = filteredTipps.length;
    const exact = filteredTipps.filter(({ match, tip }) =>
        match && match.status === "FINISHED" &&
        tip.homeGoals === match.score.fullTime.home &&
        tip.awayGoals === match.score.fullTime.away
    ).length;

    const tendency = filteredTipps.filter(({ match, tip }) => {
        if (!match || match.status !== "FINISHED") return false;
        const realDiff = match.score.fullTime.home - match.score.fullTime.away;
        const tipDiff = tip.homeGoals - tip.awayGoals;
        if (tip.homeGoals === match.score.fullTime.home && tip.awayGoals === match.score.fullTime.away) return false;
        if (realDiff === 0 && tipDiff === 0) return true;
        if (realDiff > 0 && tipDiff > 0) return true;
        if (realDiff < 0 && tipDiff < 0) return true;
        return false;
    }).length;

    const finished = filteredTipps.filter(({ match }) => match && match.status === "FINISHED").length;
    const wrong = finished - exact - tendency;
    const open = total - finished;

    const correctTotal = exact + tendency;

    // Wir stellen sicher, dass wir nur Datenpunkte hinzufügen, die auch einen Wert haben,
    // um "0%" Einträge in der Legende zu vermeiden, wenn keine Tipps dieser Kategorie vorliegen.
    const chartData = [];
    if (correctTotal > 0) {
        chartData.push({
            name: 'Richtig', // Kürzerer Name für das Diagramm
            population: correctTotal,
            color: '#43a047',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15
        });
    }
    if (wrong > 0) {
        chartData.push({
            name: 'Falsch', // Kürzerer Name für das Diagramm
            population: wrong,
            color: '#d32f2f',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15
        });
    }
    if (open > 0) {
        chartData.push({
            name: 'Offen',
            population: open,
            color: '#757575',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15
        });
    }

    // Konfiguration für das Kreisdiagramm
    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#fff",
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        // NEU: Diese Funktion formatiert die Label-Werte im Diagramm
        // Wenn `absolute` entfernt wird, zeigt `fromZero` (Standard) Prozente an.
        // `value` ist hier die Bevölkerung (Anzahl der Tipps), `total` ist die Gesamtanzahl der Tipps im Diagramm
        formatYLabel: (value, index) => {
            const totalTipsInChart = chartData.reduce((sum, d) => sum + d.population, 0);
            if (totalTipsInChart === 0) return "0%"; // Vermeide Division durch Null
            const percentage = (value / totalTipsInChart) * 100;
            return `${percentage.toFixed(0)}%`; // Zeigt ganze Prozentsätze an
        }
    };


    if (loading) {
        return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🏆 Deine Tipps</Text>
            <View style={{ marginBottom: 16 }}>
                <Picker
                    selectedValue={selectedTeam}
                    onValueChange={setSelectedTeam}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                >
                    <Picker.Item label="Alle Teams" value="ALL" />
                    {allTeams.map((team) => (
                        <Picker.Item key={team} label={team} value={team} />
                    ))}
                </Picker>
            </View>
            <View style={styles.statsBox}>
                <Text style={styles.statsTitle}>📊 Statistik</Text>
                <Text style={styles.statsText}>Getippte Spiele: <Text style={styles.statsValue}>{total}</Text></Text>
                <Text style={styles.statsText}>Exakt richtig: <Text style={[styles.statsValue, styles.statsCorrect]}>{exact} ✅</Text></Text>
                <Text style={styles.statsText}>Sieger richtig: <Text style={[styles.statsValue, styles.statsTendency]}>{tendency} 🏆</Text></Text>
                <Text style={styles.statsText}>Falsch: <Text style={[styles.statsValue, styles.statsWrong]}>{wrong} ❌</Text></Text>
                <Text style={styles.statsText}>Offen: <Text style={[styles.statsValue, styles.statsOpen]}>{open} ⏳</Text></Text>
            </View>

            {/* Diagramm nur anzeigen, wenn Tipps vorhanden sind */}
            {total > 0 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Verteilung deiner Tipps</Text>
                    <PieChart
                        data={chartData}
                        width={screenWidth - 32}
                        height={220}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"25"}
                        // WICHTIG: `absolute` entfernen, damit `formatYLabel` greift
                        // absolute 
                    />
                </View>
            )}

            <View style={styles.buttonContainer}>
                <Button title="Alle Tipps löschen" onPress={handleClear} color="#ef5350" />
            </View>
            {filteredTipps.length === 0 ? (
                selectedTeam !== 'ALL' ? (
                    <Text style={styles.noTipText}>Für dieses Team wurden noch keine Spiele getippt.</Text>
                ) : (
                    <Text style={styles.noTipText}>Keine Tipps gefunden.</Text>
                )
            ) : (
                <>
                    {filteredTipps.slice(0, visibleCount).map(({ id, tip, match }) => {
                        if (!match) return null;
                        const date = new Date(match.utcDate);
                        const finished = match.status === "FINISHED";
                        const correct =
                            finished &&
                            tip.homeGoals === match.score.fullTime.home &&
                            tip.awayGoals === match.score.fullTime.away;
                        const tendencyCorrect = finished && !correct && (
                            (match.score.fullTime.home - match.score.fullTime.away === 0 && tip.homeGoals - tip.awayGoals === 0) ||
                            (match.score.fullTime.home - match.score.fullTime.away > 0 && tip.homeGoals - tip.awayGoals > 0) ||
                            (match.score.fullTime.home - match.score.fullTime.away < 0 && tip.homeGoals - tip.awayGoals < 0)
                        );

                        return (
                            <View key={id} style={styles.tipBox}>
                                <Text style={styles.teams}>
                                    {match.homeTeam.name} vs. {match.awayTeam.name}
                                </Text>
                                <Text style={styles.date}>{date.toLocaleString()}</Text>
                                <Text style={styles.tip}>
                                    Dein Tipp: <Text style={styles.tipScore}>{tip.homeGoals} : {tip.awayGoals}</Text>
                                </Text>
                                {finished ? (
                                    <Text style={styles.result}>
                                        Ergebnis: <Text style={styles.resultScore}>{match.score.fullTime.home} : {match.score.fullTime.away}</Text>{" "}
                                        {correct ? <Text style={styles.statusCorrect}>✅ Exakt!</Text> :
                                            tendencyCorrect ? <Text style={styles.statusTendency}>🏆 Sieger richtig!</Text> :
                                                <Text style={styles.statusWrong}>❌ Falsch</Text>}
                                    </Text>
                                ) : (
                                    <Text style={styles.statusOpen}>Spiel noch nicht gespielt ⏳</Text>
                                )}
                            </View>
                        );
                    })}
                    {visibleCount < filteredTipps.length && (
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Mehr anzeigen ▼"
                                onPress={() => setVisibleCount((c) => c + 5)}
                                color="#42a5f5"
                            />
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f4f6fa",
        minHeight: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 25,
        textAlign: "center",
        color: '#1a237e',
        letterSpacing: 1,
    },
    statsBox: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'flex-start',
    },
    statsTitle: {
        fontWeight: "bold",
        marginBottom: 12,
        fontSize: 20,
        color: '#3949ab',
        alignSelf: 'center',
    },
    statsText: {
        fontSize: 16,
        marginBottom: 4,
        color: '#424242',
    },
    statsValue: {
        fontWeight: 'bold',
    },
    statsCorrect: {
        color: '#43a047',
    },
    statsTendency: {
        color: '#ffb300',
    },
    statsWrong: {
        color: '#d32f2f',
    },
    statsOpen: {
        color: '#757575',
    },
    tipBox: {
        marginBottom: 18,
        padding: 18,
        borderWidth: 0,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    teams: {
        fontWeight: "bold",
        fontSize: 18,
        color: '#263238',
        marginBottom: 4,
    },
    date: {
        color: "#78909c",
        marginBottom: 8,
        fontSize: 13,
    },
    tip: {
        marginTop: 6,
        fontSize: 16,
        color: '#37474f',
    },
    tipScore: {
        fontWeight: 'bold',
        color: '#1a237e',
    },
    result: {
        marginTop: 8,
        fontSize: 16,
        color: '#37474f',
    },
    resultScore: {
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    statusCorrect: {
        color: '#43a047',
        fontWeight: 'bold',
    },
    statusTendency: {
        color: '#ffb300',
        fontWeight: 'bold',
    },
    statusWrong: {
        color: '#d32f2f',
        fontWeight: 'bold',
    },
    statusOpen: {
        color: "#888",
        fontStyle: 'italic',
        marginTop: 6,
    },
    picker: {
        backgroundColor: '#e8eaf6',
        borderRadius: 10,
        marginBottom: 15,
        color: '#1a237e',
        borderWidth: 1,
        borderColor: '#c5cae9',
    },
    pickerItem: {
        fontSize: 16,
        color: '#1a237e',
    },
    buttonContainer: {
        marginVertical: 15,
        borderRadius: 10,
        overflow: 'hidden',
    },
    noTipText: {
        textAlign: 'center',
        color: '#90a4ae',
        fontSize: 17,
        marginVertical: 40,
        lineHeight: 24,
    },
    chartContainer: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 14,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
    },
    chartTitle: {
        fontWeight: "bold",
        marginBottom: 10,
        fontSize: 20,
        color: '#3949ab',
        marginTop: 10,
    }
});