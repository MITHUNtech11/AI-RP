import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { RankingSession, RankingResult } from '../types/resume';

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
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>

            <View style={styles.nameAndScore}>
              <Text style={styles.candidateName} numberOfLines={1}>
                {item.candidate_name}
              </Text>
              <Text style={styles.scoreLabel}>{getScoreLabel(item.overall_score)}</Text>
            </View>
          </View>

          <View style={styles.scoreCircle}>
            <View style={[styles.scorePercentageBg, { borderColor: scoreColor }]}>
              <Text style={[styles.scorePercentage, { color: scoreColor }]}>
                {item.score_percentage}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Score Breakdown (Quick View) */}
        <View style={styles.scoreBreakdownRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Skills</Text>
            <Text style={styles.scoreItemValue}>{Math.round(item.scores.skills * 100)}%</Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Experience</Text>
            <Text style={styles.scoreItemValue}>{Math.round(item.scores.experience * 100)}%</Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Job Title</Text>
            <Text style={styles.scoreItemValue}>{Math.round(item.scores.job_title * 100)}%</Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>Education</Text>
            <Text style={styles.scoreItemValue}>{Math.round(item.scores.education * 100)}%</Text>
          </View>
        </View>

        {/* Expand Icon */}
        <View style={styles.expandToggle}>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            {/* Matched Skills */}
            {item.details.matched_skills.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>✓ Matched Skills</Text>
                <View style={styles.skillsContainer}>
                  {item.details.matched_skills.map((skill, idx) => (
                    <View key={idx} style={styles.matchedSkill}>
                      <Text style={styles.matchedSkillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Missing Skills */}
            {item.details.missing_skills.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>✗ Missing Skills</Text>
                <View style={styles.skillsContainer}>
                  {item.details.missing_skills.map((skill, idx) => (
                    <View key={idx} style={styles.missingSkill}>
                      <Text style={styles.missingSkillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Experience */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>💼 Experience</Text>
              <Text style={styles.detailText}>
                Candidate has <Text style={styles.detailBold}>{item.details.candidate_experience_years} years</Text> of experience
              </Text>
              <Text style={styles.detailText}>
                Position requires <Text style={styles.detailBold}>{item.details.jd_required_experience_years}+ years</Text>
              </Text>
            </View>

            {/* Education */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>🎓 Education</Text>
              <Text style={styles.detailText}>
                Candidate: <Text style={styles.detailBold}>{item.details.candidate_education}</Text>
              </Text>
              <Text style={styles.detailText}>
                Required: <Text style={styles.detailBold}>{item.details.jd_required_education}</Text>
              </Text>
            </View>

            {/* Job Titles */}
            {item.details.candidate_job_titles.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>📌 Previous Roles</Text>
                {item.details.candidate_job_titles.map((title, idx) => (
                  <Text key={idx} style={styles.detailText}>
                    • {title}
                  </Text>
                ))}
              </View>
            )}

            {/* AI Reasoning */}
            {item.reasoning && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>💡 Assessment</Text>
                <Text style={styles.reasoningText}>{item.reasoning}</Text>
              </View>
            )}

            {/* Error (if any) */}
            {item.error && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>⚠️ Note</Text>
                <Text style={styles.errorText}>{item.error}</Text>
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
          <Text style={styles.title}>Ranking Results</Text>
          <Text style={styles.subtitle}>{session.jd.job_title}</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryStats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{session.rankings.length}</Text>
            <Text style={styles.statLabel}>Candidates</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {Math.round(
                (session.rankings.reduce((sum, r) => sum + r.overall_score, 0) /
                  session.rankings.length) *
                  100
              )}%
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {(session.processingTime / 1000).toFixed(1)}s
            </Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* Top Candidate Highlight */}
        {session.rankings.length > 0 && (
          <View style={styles.topCandidateBox}>
            <Text style={styles.topCandidateLabel}>🏆 Best Fit</Text>
            <Text style={styles.topCandidateName}>{session.rankings[0].candidate_name}</Text>
            <Text style={styles.topCandidateScore}>
              {session.rankings[0].score_percentage}% Match
            </Text>
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
          <Text style={styles.newSessionButtonText}>+ New Ranking Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryStats: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  topCandidateBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  topCandidateLabel: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 8,
  },
  topCandidateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  topCandidateScore: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    marginBottom: 20,
  },
  candidateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  nameAndScore: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
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
  scorePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreBreakdownRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  scoreItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  expandToggle: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  expandIcon: {
    color: '#999',
    fontSize: 12,
  },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  detailSection: {
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  detailBold: {
    fontWeight: 'bold',
    color: '#333',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchedSkill: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  matchedSkillText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '500',
  },
  missingSkill: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  missingSkillText: {
    fontSize: 11,
    color: '#c62828',
    fontWeight: '500',
  },
  reasoningText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    lineHeight: 18,
  },
  listSeparator: {
    height: 0,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  newSessionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  newSessionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RankingsResult;
