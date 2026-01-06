import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';

interface CourseTrend {
  code: string;
  name: string;
  enrolled?: number;
  capacity?: number;
  percentage?: number;
}

export default function AdminDashboardScreen() {
  const { alerts, userInfo } = useSelection();

  // Sample course data
  const courseTrends: CourseTrend[] = [
    { code: 'CS101', name: 'Intro to Programming' },
    { code: 'CS102', name: 'Data Structures' },
    { code: 'ENG205', name: 'Software Arch & Design', enrolled: 92, capacity: 100, percentage: 92 },
    { code: 'ENG206', name: 'Database Systems Management', enrolled: 80, capacity: 100, percentage: 80 },
    { code: 'PHY101', name: 'Classical Mechanics' },
    { code: 'FIN201', name: 'Corporate Finance I' },
    { code: 'ART110', name: 'History of Modern Art & Visual Culture' },
  ];

  const highDemandCourses = [
    { name: 'Software Arch & Design', percentage: 92 },
    { name: 'Database Systems Management', percentage: 80 },
    { name: 'Intro to Programming', percentage: 0 },
  ];

  const unreadAlertCount = alerts.filter((alert) => !alert.isRead).length;

  const getProgressBarColor = (percentage?: number) => {
    if (!percentage) return '#E0E0E0';
    if (percentage >= 90) return '#FF4444'; // Red
    if (percentage >= 70) return '#5B4C9D'; // Purple
    return '#E0E0E0'; // Grey
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>ANALYTICS SUITE</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Dashboard Title */}
        <ThemedText style={styles.dashboardTitle}>Admin Dashboard</ThemedText>
        
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          {/* Total Enrollment Card */}
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>TOTAL ENROLLMENT</ThemedText>
            <ThemedText style={styles.metricValue}>172</ThemedText>
            <View style={styles.changeContainer}>
              <ThemedText style={styles.changePositive}>+12%</ThemedText>
              <ThemedText style={styles.changeText}> vs last term</ThemedText>
            </View>
          </View>

          {/* Peak Utilization Card */}
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>PEAK UTILIZATION</ThemedText>
            <ThemedText style={styles.metricValueOrange}>10:00</ThemedText>
            <ThemedText style={styles.metricDescription}>Busiest scheduling block</ThemedText>
          </View>
        </View>

        {/* Course Registration Trends */}
        <View style={styles.trendsCard}>
          <ThemedText style={styles.sectionTitle}>COURSE REGISTRATION TRENDS</ThemedText>
          {courseTrends.map((course, index) => (
            <View key={index} style={styles.courseRow}>
              <View style={styles.courseInfo}>
                <ThemedText style={styles.courseCode}>{course.code}</ThemedText>
                <ThemedText style={styles.courseName}>{course.name}</ThemedText>
              </View>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: course.percentage ? `${course.percentage}%` : '100%',
                      backgroundColor: getProgressBarColor(course.percentage),
                    },
                  ]}
                />
                {course.enrolled !== undefined && course.capacity !== undefined && (
                  <ThemedText style={styles.progressText}>
                    {course.enrolled}/{course.capacity}
                  </ThemedText>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Demand Analysis Report */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <ThemedText style={styles.reportTitle}>DEMAND ANALYSIS REPORT</ThemedText>
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialIcons name="download" size={24} color="#B8B3E0" />
            </TouchableOpacity>
          </View>

          {/* High Demand Electives */}
          <View style={styles.reportSection}>
            <ThemedText style={styles.reportSectionTitle}>HIGH DEMAND ELECTIVES</ThemedText>
            {highDemandCourses.map((course, index) => (
              <View key={index} style={styles.demandItem}>
                <ThemedText style={styles.demandCourseName}>{course.name}</ThemedText>
                <View style={styles.demandBadge}>
                  <ThemedText style={styles.demandBadgeText}>{course.percentage}% CAP</ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Scheduling Bottlenecks */}
          <View style={styles.reportSection}>
            <ThemedText style={styles.reportSectionTitle}>SCHEDULING BOTTLENECKS</ThemedText>
            <ThemedText style={styles.bottleneckText}>
              Student preferences show heavy density around 10:00 AM. Recommend moving 2-3
              elective sections to 03:00 PM to optimize classroom allocation.
            </ThemedText>
          </View>

          {/* Export Buttons */}
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportPdfButton} activeOpacity={0.8}>
              <ThemedText style={styles.exportPdfText}>EXPORT PLANNING PDF</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportCsvButton} activeOpacity={0.8}>
              <MaterialIcons name="download" size={20} color="#FFFFFF" />
              <ThemedText style={styles.exportCsvText}>DOWNLOAD DATA CSV</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <MaterialIcons name="bar-chart" size={24} color="#5B4C9D" />
          <ThemedText style={styles.navItemTextActive}>ANALYSIS</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/notes')}>
          <MaterialIcons name="description" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>NOTES</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/account')}>
          <MaterialIcons name="account-circle" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>ACCOUNT</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerTitleSmart: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5B4C9D',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5B4C9D',
    marginBottom: 8,
  },
  metricValueOrange: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePositive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  changeText: {
    fontSize: 14,
    color: '#9B9B9B',
    marginLeft: 4,
  },
  metricDescription: {
    fontSize: 14,
    color: '#9B9B9B',
  },
  trendsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  courseRow: {
    marginBottom: 16,
  },
  courseInfo: {
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4C9D',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9B9B9B',
    minWidth: 50,
    textAlign: 'right',
  },
  reportCard: {
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B8B3E0',
    textTransform: 'uppercase',
  },
  reportSection: {
    marginBottom: 24,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8B3E0',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  demandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  demandCourseName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  demandBadge: {
    backgroundColor: '#B8B3E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demandBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B4C9D',
  },
  bottleneckText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  exportButtons: {
    gap: 12,
    marginTop: 8,
  },
  exportPdfButton: {
    backgroundColor: '#B8B3E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exportPdfText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B4C9D',
    letterSpacing: 0.5,
  },
  exportCsvButton: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportCsvText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navItemText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9B9B9B',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  navItemTextActive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5B4C9D',
    marginTop: 4,
    textTransform: 'uppercase',
  },
});

