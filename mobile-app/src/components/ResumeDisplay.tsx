import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ResumeData } from '../types/resume';
import { THEME } from '../theme';

interface ResumeDisplayProps {
  resumeData: ResumeData;
  onNewResume: () => void;
}

export function ResumeDisplay({ resumeData, onNewResume }: ResumeDisplayProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  const tabs = ['overview', 'skills', 'education', 'experience'];

  return (
    <View style={styles.resultsSection}>
      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(resumeData.personalInfo?.fullName?.[0] || 'U').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {resumeData.personalInfo?.fullName || 'Unknown'}
              </Text>
              {resumeData.personalInfo?.email && (
                <Text style={styles.profileDetail}>
                  📧 {resumeData.personalInfo.email}
                </Text>
              )}
              {resumeData.personalInfo?.phone && (
                <Text style={styles.profileDetail}>
                  📱 {resumeData.personalInfo.phone}
                </Text>
              )}
            </View>
          </View>

          {/* Summary */}
          {resumeData.summary && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Professional Summary</Text>
              <Text style={styles.cardText}>{resumeData.summary}</Text>
            </View>
          )}

          {/* Location */}
          {resumeData.personalInfo?.location && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Location</Text>
              <Text style={styles.cardText}>
                📍 {resumeData.personalInfo.location}
              </Text>
            </View>
          )}

          {/* File Info */}
          {resumeData.fileName && (
            <View style={[styles.card, styles.fileInfoCard]}>
              <Text style={styles.cardTitle}>Source File</Text>
              <Text style={styles.cardText}>{resumeData.fileName}</Text>
              {resumeData.uploadDate && (
                <Text style={styles.cardMeta}>
                  📅 {new Date(resumeData.uploadDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {selectedTab === 'skills' && (
        <View style={styles.tabContent}>
          {resumeData.skills && resumeData.skills.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skills ({resumeData.skills.length})</Text>
              <View style={styles.skillsGrid}>
                {resumeData.skills.map((skill: string, idx: number) => (
                  <View key={idx} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>No skills found</Text>
            </View>
          )}
        </View>
      )}

      {selectedTab === 'education' && (
        <View style={styles.tabContent}>
          {resumeData.education && resumeData.education.length > 0 ? (
            resumeData.education.map((edu: any, idx: number) => (
              <View key={idx} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardSubtitle}>{edu.degree}</Text>
                    <Text style={styles.cardMeta}>{edu.school}</Text>
                  </View>
                  {edu.graduationDate && (
                    <Text style={styles.cardYear}>{edu.graduationDate}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎓</Text>
              <Text style={styles.emptyStateText}>No education details found</Text>
            </View>
          )}
        </View>
      )}

      {selectedTab === 'experience' && (
        <View style={styles.tabContent}>
          {resumeData.experience && resumeData.experience.length > 0 ? (
            resumeData.experience.map((job: any, idx: number) => (
              <View key={idx} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardSubtitle}>{job.title}</Text>
                    <Text style={styles.cardMeta}>{job.company}</Text>
                  </View>
                  {job.startDate && (
                    <Text style={styles.cardYear}>
                      {job.startDate}
                      {job.endDate ? ` - ${job.endDate}` : ' - Present'}
                    </Text>
                  )}
                </View>
                {job.description && (
                  <Text style={styles.cardText}>{job.description}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💼</Text>
              <Text style={styles.emptyStateText}>
                No work experience found
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resultsSection: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textLight,
    fontFamily: 'Poppins-SemiBold',
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  tabContent: {
    paddingBottom: THEME.spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.xl,
    paddingBottom: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.lg,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
    fontFamily: 'Poppins-Bold',
  },
  profileDetail: {
    fontSize: 12,
    color: THEME.colors.textLight,
    marginVertical: 2,
    fontFamily: 'Poppins',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  fileInfoCard: {
    backgroundColor: THEME.colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
    fontFamily: 'Poppins-Bold',
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    fontFamily: 'Poppins-Bold',
  },
  cardText: {
    fontSize: 13,
    color: THEME.colors.text,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  cardMeta: {
    fontSize: 12,
    color: THEME.colors.textLight,
    marginTop: THEME.spacing.xs,
    fontFamily: 'Poppins',
  },
  cardYear: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
  },
  skillTag: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.full,
  },
  skillTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: THEME.spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: THEME.colors.textLight,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
});
