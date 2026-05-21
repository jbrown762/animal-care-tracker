import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppShell } from "@/components/AppShell";

const attentionRows = [
  {
    animal: "Zuko",
    category: "Diet",
    due: "May 15 (2 days ago)",
    species: "Bearded Dragon",
    status: "Overdue",
    task: "Feeding"
  },
  {
    animal: "Luna",
    category: "Enclosure",
    due: "May 16 (yesterday)",
    species: "Ball Python",
    status: "Overdue",
    task: "Water Change"
  },
  {
    animal: "Mango",
    category: "Enclosure",
    due: "May 17 (today)",
    species: "Green Iguana",
    status: "Overdue",
    task: "Soak"
  },
  {
    animal: "Koda",
    category: "Diet",
    due: "May 18 (in 1 day)",
    species: "Red-eared Slider",
    status: "Due Soon",
    task: "Feeding"
  },
  {
    animal: "Willow",
    category: "Enclosure",
    due: "May 19 (in 2 days)",
    species: "Sulcata Tortoise",
    status: "Due Soon",
    task: "Enclosure Clean"
  }
];

const recentLogs = [
  { animal: "Zuko", category: "Diet", detail: "Mealworms", task: "Feeding", time: "May 17, 2025 9:15 AM" },
  { animal: "Luna", category: "Stats", detail: "612 g", task: "Weight Check", time: "May 17, 2025 8:45 AM" },
  { animal: "Mango", category: "Enclosure", detail: "20 minutes", task: "Soak", time: "May 17, 2025 8:30 AM" },
  { animal: "Willow", category: "Enclosure", detail: "Done", task: "Enclosure Clean", time: "May 17, 2025 7:50 AM" },
  { animal: "Koda", category: "Diet", detail: "3 shrimp", task: "Feeding", time: "May 17, 2025 6:10 PM" }
];

const stats = [
  { color: "#e63757", icon: "alert", label: "Overdue", sublabel: "Animals with overdue tasks", value: "8" },
  { color: "#f59e0b", icon: "time-outline", label: "Due Soon", sublabel: "Due within next 3 days", value: "5" },
  { color: "#2bb673", icon: "checkmark", label: "Current", sublabel: "Up to date", value: "27" },
  { color: "#4f8ee8", icon: "paw", label: "Total Animals", sublabel: "Across all classes", value: "40" }
] as const;

type StatCardProps = (typeof stats)[number] & {
  compact: boolean;
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 900;

  return (
    <AppShell>
      <View style={compact ? styles.mobileStats : styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.label} compact={compact} {...stat} />
        ))}
      </View>

      <Panel title="Attention Needed" action="View all">
        {compact ? <MobileAttentionList /> : <DesktopAttentionTable />}
      </Panel>

      <View style={compact ? styles.singleColumn : styles.bottomGrid}>
        <Panel title="Recent Logs" action="View all">
          {recentLogs.map((log) => (
            <LogRow key={`${log.animal}-${log.task}`} {...log} />
          ))}
        </Panel>
        {!compact ? (
          <Panel title="Tasks by Tag">
            <View style={styles.chartArea}>
              <DonutChart />
              <View style={styles.legend}>
                <Legend color="#8b6eea" label="Diet" value="40% (16)" />
                <Legend color="#4f8ee8" label="Enclosure" value="30% (12)" />
                <Legend color="#e74d66" label="Health" value="15% (6)" />
                <Legend color="#62bd68" label="Stats" value="10% (4)" />
                <Legend color="#aeb8c2" label="Other" value="5% (2)" />
              </View>
            </View>
          </Panel>
        ) : null}
      </View>
    </AppShell>
  );
}

function StatCard({
  color,
  compact,
  icon,
  label,
  sublabel,
  value
}: StatCardProps) {
  return (
    <View style={compact ? styles.statCardMobile : styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={compact ? 18 : 32} color="#ffffff" />
      </View>
      <View>
        <View style={styles.statLine}>
          <Text style={compact ? styles.statValueMobile : styles.statValue}>{value}</Text>
          <Text style={compact ? styles.statLabelMobile : styles.statLabel}>{compact && label === "Total Animals" ? "Total" : label}</Text>
        </View>
        {!compact ? <Text style={styles.statSublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

function Panel({ action, children, title }: React.PropsWithChildren<{ action?: string; title: string }>) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{title}</Text>
        {action ? <Text style={styles.panelAction}>{action}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function DesktopAttentionTable() {
  return (
    <View>
      <View style={styles.tableHead}>
        <Text style={styles.headAnimal}>Animal</Text>
        <Text style={styles.headCell}>Task</Text>
        <Text style={styles.headCell}>Category</Text>
        <Text style={styles.headCell}>Due Date</Text>
        <Text style={styles.headCell}>Status</Text>
      </View>
      {attentionRows.map((row) => (
        <View key={row.animal} style={styles.tableRow}>
          <View style={styles.animalCell}>
            <Image source={{ uri: avatarUrl(row.animal) }} style={styles.animalAvatar} />
            <View>
              <Text style={styles.animalName}>{row.animal}</Text>
              <Text style={styles.species}>{row.species}</Text>
            </View>
          </View>
          <Text style={styles.tableText}>{row.task}</Text>
          <View style={styles.tableCell}>
            <Tag label={row.category} />
          </View>
          <Text style={row.status === "Overdue" ? styles.dueOverdue : styles.dueSoon}>{row.due}</Text>
          <View style={styles.tableCell}>
            <StatusPill status={row.status} />
          </View>
        </View>
      ))}
    </View>
  );
}

function MobileAttentionList() {
  return (
    <View>
      {attentionRows.map((row) => (
        <View key={row.animal} style={styles.mobileAttentionRow}>
          <Image source={{ uri: avatarUrl(row.animal) }} style={styles.animalAvatarLarge} />
          <View style={styles.mobileAttentionText}>
            <Text style={styles.animalName}>{row.animal}</Text>
            <Text style={styles.species}>{row.species}</Text>
            <Text style={styles.mobileTask}>{row.task}</Text>
            <Text style={row.status === "Overdue" ? styles.dueOverdue : styles.dueSoon}>{row.due}</Text>
          </View>
          <StatusPill status={row.status} />
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </View>
      ))}
    </View>
  );
}

function LogRow({ animal, category, detail, task, time }: (typeof recentLogs)[number]) {
  return (
    <View style={styles.logRow}>
      <Image source={{ uri: avatarUrl(animal) }} style={styles.animalAvatar} />
      <View style={styles.logText}>
        <Text style={styles.logTitle}>
          {animal} - {task}
        </Text>
        <Text style={styles.logDetail}>{detail}</Text>
        <Text style={styles.species}>{time}</Text>
      </View>
      <Tag label={category} />
    </View>
  );
}

function Tag({ label }: { label: string }) {
  const palette: Record<string, { backgroundColor: string; color: string }> = {
    Diet: { backgroundColor: "#eadcff", color: "#6d3ed1" },
    Enclosure: { backgroundColor: "#dbeafe", color: "#0b63ce" },
    Health: { backgroundColor: "#ffe1e6", color: "#c81e4a" },
    Stats: { backgroundColor: "#d9f3df", color: "#14783f" }
  };
  return <Text style={[styles.tag, palette[label] ?? palette.Diet]}>{label}</Text>;
}

function StatusPill({ status }: { status: string }) {
  const overdue = status === "Overdue";
  return <Text style={overdue ? styles.statusOverdue : styles.statusSoon}>{status}</Text>;
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function DonutChart() {
  return (
    <View style={styles.donutOuter}>
      <View style={styles.donutSliceA} />
      <View style={styles.donutSliceB} />
      <View style={styles.donutCenter} />
    </View>
  );
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/thumbs/png?seed=${encodeURIComponent(seed)}&backgroundColor=d9e6db,e5c7a6,b6d7a8`;
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    gap: 14
  },
  mobileStats: {
    flexDirection: "row",
    gap: 8
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 18,
    minHeight: 132,
    padding: 22
  },
  statCardMobile: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minHeight: 76,
    padding: 8
  },
  statIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  statLine: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8
  },
  statValue: {
    color: "#050505",
    fontSize: 34,
    fontWeight: "900"
  },
  statValueMobile: {
    color: "#050505",
    fontSize: 24,
    fontWeight: "900"
  },
  statLabel: {
    color: "#050505",
    fontSize: 16,
    fontWeight: "800"
  },
  statLabelMobile: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "700"
  },
  statSublabel: {
    color: "#4b5563",
    fontSize: 15,
    marginTop: 10
  },
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  panelHeader: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  panelTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900"
  },
  panelAction: {
    color: "#005bd3",
    fontSize: 14,
    fontWeight: "800"
  },
  tableHead: {
    backgroundColor: "#fbfbfc",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 11
  },
  headAnimal: {
    color: "#111827",
    flex: 1.35,
    fontSize: 14,
    fontWeight: "800"
  },
  headCell: {
    color: "#111827",
    flex: 1,
    fontSize: 14,
    fontWeight: "800"
  },
  tableRow: {
    alignItems: "center",
    borderBottomColor: "#eef2f7",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  animalCell: {
    alignItems: "center",
    flex: 1.35,
    flexDirection: "row",
    gap: 12
  },
  animalAvatar: {
    borderRadius: 18,
    height: 36,
    width: 36
  },
  animalAvatarLarge: {
    borderRadius: 22,
    height: 44,
    width: 44
  },
  animalName: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900"
  },
  species: {
    color: "#475569",
    fontSize: 12
  },
  tableText: {
    color: "#111827",
    flex: 1,
    fontSize: 15
  },
  tableCell: {
    flex: 1
  },
  dueOverdue: {
    color: "#e0001b",
    flex: 1,
    fontSize: 14
  },
  dueSoon: {
    color: "#f59e0b",
    flex: 1,
    fontSize: 14
  },
  tag: {
    alignSelf: "flex-start",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 6,
    textAlign: "center"
  },
  statusOverdue: {
    alignSelf: "flex-start",
    backgroundColor: "#ffd9dd",
    borderRadius: 8,
    color: "#e0001b",
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    textAlign: "center"
  },
  statusSoon: {
    alignSelf: "flex-start",
    backgroundColor: "#ffedc3",
    borderRadius: 8,
    color: "#d97706",
    fontSize: 13,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    textAlign: "center"
  },
  mobileAttentionRow: {
    alignItems: "center",
    borderBottomColor: "#eef2f7",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  mobileAttentionText: {
    flex: 1
  },
  mobileTask: {
    color: "#111827",
    fontSize: 13
  },
  bottomGrid: {
    flexDirection: "row",
    gap: 18
  },
  singleColumn: {
    gap: 18
  },
  logRow: {
    alignItems: "center",
    borderBottomColor: "#eef2f7",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 11
  },
  logText: {
    flex: 1
  },
  logTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900"
  },
  logDetail: {
    color: "#111827",
    fontSize: 13
  },
  chartArea: {
    alignItems: "center",
    flexDirection: "row",
    gap: 28,
    justifyContent: "center",
    minHeight: 260,
    padding: 24
  },
  donutOuter: {
    backgroundColor: "#8b6eea",
    borderRadius: 86,
    height: 172,
    overflow: "hidden",
    width: 172
  },
  donutSliceA: {
    backgroundColor: "#4f8ee8",
    bottom: 0,
    height: 84,
    left: 0,
    position: "absolute",
    width: 172
  },
  donutSliceB: {
    backgroundColor: "#62bd68",
    height: 86,
    left: 0,
    position: "absolute",
    top: 0,
    width: 66
  },
  donutCenter: {
    backgroundColor: "#ffffff",
    borderRadius: 52,
    height: 104,
    left: 34,
    position: "absolute",
    top: 34,
    width: 104
  },
  legend: {
    gap: 15,
    minWidth: 180
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  legendDot: {
    borderRadius: 4,
    height: 10,
    width: 10
  },
  legendLabel: {
    color: "#475569",
    flex: 1,
    fontSize: 14
  },
  legendValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700"
  }
});
