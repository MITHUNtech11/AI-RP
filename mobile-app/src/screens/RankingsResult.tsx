import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { RankingSession, RankingResult } from '../types/resume';
import { THEME } from '../theme';
import { ThemedText } from '../components/ThemedText';

interface RankingsResultProps {
  session: RankingSession;
  onNewSession: () => void;
}

const RankingsResult: React.FC<RankingsResultProps> = ({ session, onNewSession }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    if (score >= 0.4) return '#FF9800';
    return '#f44336';
  };

  const getScoreLabel = (score: number): string => {
    const percentage = Math.round(score * 100);
    if (percentage >= 80) return 'Excellent Fit';
    if (percentage >= 70) return 'Good Fit';
    if (percentage >= 50) return 'Moderate Fit';
    if (percentage >= 30) return 'Limited Fit';
    return 'Poor Fit';
  };

  const renderCandidateCard = ({ item, index }: { item: RankingResult; index: number }) => {
    const isExpanded = expandedIndex === index;
    const scoreColor = getScoreColor(item.overall_score);

    return (
      <View style={styles.candidateCard}>
        {/* Header */}
        <TouchableOpacity
          style={styles.candidateHeader}
          onPress={() => toggleExpand(index)}
        >
          <View style={styles.rankAndScore}>
            <View style={[styles.rankBadge, { backgroundColor: scoreColor }]}>
              <ThemedText variant="button" color="#fff">#{index + 1}</ThemedText>
            </View>

            <View style={styles.nameAndScore}>
              <ThemedText variant="bodyBold" numberOfLines={1}>
                {item.candidate_name}
              </ThemedText>
              <ThemedText variant="caption" color={THEME.colors.textMuted}>
                {getScoreLabel(item.overall_score)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.scoreCircle}>
            <View style={[styles.scorePercentageBg, { borderColor: scoreColor }]}>
              <ThemedText variant="h4" color={scoreColor}>
                {item.score_percentage}%
              </ThemedText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Score Breakdown (Quick View) */}
        <View style={styles.scoreBreakdownRow}>
          <View style={styles.scoreItem}>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>Skills</ThemedText>
            <ThemedText variant="bodyBold">{Math.round(item.scores.skills * 100)}%</ThemedText>
          </View>

          <View style={styles.scoreItem}>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>Experience</ThemedText>
            <ThemedText variant="bodyBold">{Math.round(item.scores.experience * 100)}%</ThemedText>
          </View>

          <View style={styles.scoreItem}>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>Job Title</ThemedText>
            <ThemedText variant="bodyBold">{Math.round(item.scores.job_title * 100)}%</ThemedText>
          </View>

          <View style={styles.scoreItem}>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>Education</ThemedText>
            <ThemedText variant="bodyBold">{Math.round(item.scores.education * 100)}%</ThemedText>
          </View>
        </View>

        {/* Expand Icon */}
        <View style={styles.expandToggle}>
          <ThemedText variant="caption" color={THEME.colors.textMuted}>
            {isExpanded ? '▲' : '▼'}
          </ThemedText>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            {/* Matched Skills */}
            {item.details.matched_skills.length > 0 && (
              <View style={styles.detailSection}>
                <ThemedText variant="bodyBold">✓ Matched Skills</ThemedText>
                <View style={styles.skillsContainer}>
                  {item.details.matched_skills.map((skill, idx) => (
                    <View key={idx} style={styles.matchedSkill}>
                      <ThemedText variant="caption" color={THEME.colors.success}>{skill}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Missing Skills */}
            {item.details.missing_skills.length > 0 && (
              <View style={styles.detailSection}>
                <ThemedText variant="bodyBold">✗ Missing Skills</ThemedText>
                <View style={styles.skillsContainer}>
                  {item.details.missing_skills.map((skill, idx) => (
                    <View key={idx} style={styles.missingSkill}>
                      <ThemedText variant="caption" color={THEME.colors.danger}>{skill}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Experience */}
            <View style={styles.detailSection}>
              <ThemedText variant="bodyBold">💼 Experience</ThemedText>
              <ThemedText variant="body" color={THEME.colors.text}>
                Candidate has{' '}
                <ThemedText variant="bodyBold" color={THEME.colors.text}>{item.details.candidate_experience_years} years</ThemedText>
                {' '}of experience
              </ThemedText>
              <ThemedText variant="body" color={THEME.colors.text}>
                Position requires{' '}
                <ThemedText variant="bodyBold" color={THEME.colors.text}>{item.details.jd_required_experience_years}+ years</ThemedText>
              </ThemedText>
            </View>

            {/* Education */}
            <View style={styles.detailSection}>
              <ThemedText variant="bodyBold">🎓 Education</ThemedText>
              <ThemedText variant="body" color={THEME.colors.text}>
                Candidate:{' '}
                <ThemedText variant="bodyBold" color={THEME.colors.text}>{item.details.candidate_education}</ThemedText>
              </ThemedText>
              <ThemedText variant="body" color={THEME.colors.text}>
                Required:{' '}
                <ThemedText variant="bodyBold" color={THEME.colors.text}>{item.details.jd_required_education}</ThemedText>
              </ThemedText>
            </View>

            {/* Job Titles */}
            {item.details.candidate_job_titles.length > 0 && (
              <View style={styles.detailSection}>
                <ThemedText variant="bodyBold">📌 Previous Roles</ThemedText>
                {item.details.candidate_job_titles.map((title, idx) => (
                  <ThemedText key={idx} variant="body" color={THEME.colors.text}>
                    • {title}
                  </ThemedText>
                ))}
              </View>
            )}

            {/* AI Reasoning */}
            {item.reasoning && (
              <View style={styles.detailSection}>
                <ThemedText variant="bodyBold">💡 Assessment</ThemedText>
                <ThemedText variant="body" color={THEME.colors.text} style={{ fontStyle: 'italic' }}>
                  {item.reasoning}
                </ThemedText>
              </View>
            )}

            {/* Error (if any) */}
            {item.error && (
              <View style={styles.detailSection}>
                <ThemedText variant="bodyBold">⚠️ Note</ThemedText>
                <ThemedText variant="body" color={THEME.colors.danger}>
                  {item.error}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2" style={{ marginBottom: THEME.spacing.xs }}>
            Ranking Results
          </ThemedText>
          <ThemedText variant="body" color={THEME.colors.textMuted}>
            {session.jd.job_title}
          </ThemedText>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryStats}>
          <View style={styles.statBox}>
            <ThemedText variant="h4" color={THEME.colors.primary}>
              {session.rankings.length}
            </ThemedText>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>
              Candidates
            </ThemedText>
          </View>

          <View style={styles.statBox}>
            <ThemedText variant="h4" color={THEME.colors.primary}>
              {Math.round(
                (session.rankings.reduce((sum, r) => sum + r.overall_score, 0) /
                  session.rankings.length) *
                  100
              )}%
            </ThemedText>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>
              Avg Score
            </ThemedText>
          </View>

          <View style={styles.statBox}>
            <ThemedText variant="h4" color={THEME.colors.primary}>
              {(session.processingTime / 1000).toFixed(1)}s
            </ThemedText>
            <ThemedText variant="caption" color={THEME.colors.textMuted}>
              Time
            </ThemedText>
          </View>
        </View>

        {/* Top Candidate Highlight */}
        {session.rankings.length > 0 && (
          <View style={styles.topCandidateBox}>
            <ThemedText variant="caption" color="#856404">🏆 Best Fit</ThemedText>
            <ThemedText variant="h4" color="#333" style={{ marginBottom: THEME.spacing.xs }}>
              {session.rankings[0].candidate_name}
            </ThemedText>
            <ThemedText variant="body" color={THEME.colors.text}>
              {session.rankings[0].score_percentage}% Match
            </ThemedText>
          </View>
        )}

        {/* Ranked List */}
        <View style={styles.listContainer}>
          <FlatList
            scrollEnabled={false}
            data={session.rankings}
            renderItem={renderCandidateCard}
            keyExtractor={(_, index) => index.toString()}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.newSessionButton} onPress={onNewSession}>
          <ThemedText variant="button" color="#fff">+ New Ranking Session</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  header: {
    marginBottom: THEME.spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  topCandidateBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  listContainer: {
    marginBottom: THEME.spacing.lg,
  },
  candidateCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
  },
  rankAndScore: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.md,
  },
  nameAndScore: {
    flex: 1,
  },
  scoreCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercentageBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBreakdownRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  expandToggle: {
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
  },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
  },
  detailSection: {
    marginBottom: THEME.spacing.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.xs,
    marginTop: THEME.spacing.xs,
  },
  matchedSkill: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  missingSkill: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.danger,
  },
  listSeparator: {
    height: 0,
  },
  footerContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  newSessionButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    minHeight: 44,
  },
});

export default RankingsResult;
