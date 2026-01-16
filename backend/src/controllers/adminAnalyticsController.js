const analyticsService = require('../services/analyticsService');
const { User, Department, MatchingRound, Pairing, MeetingFeedback } = require('../models');
const logger = require('../utils/logger');

/**
 * Simple CSV converter
 */
function jsonToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Get overview dashboard statistics
 */
const getOverview = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.id} requested analytics overview`);

    const data = await analyticsService.getOverviewStats();

    res.json({ data });
  } catch (error) {
    logger.error('Get analytics overview error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch analytics overview'
    });
  }
};

/**
 * Get participation trends
 */
const getParticipationTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const data = await analyticsService.getParticipationTrends(parseInt(months, 10));

    res.json({ data });
  } catch (error) {
    logger.error('Get participation trends error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch participation trends'
    });
  }
};

/**
 * Get completion rate trends
 */
const getCompletionTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const data = await analyticsService.getCompletionTrends(parseInt(months, 10));

    res.json({ data });
  } catch (error) {
    logger.error('Get completion trends error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch completion trends'
    });
  }
};

/**
 * Get department statistics
 */
const getDepartmentStats = async (req, res) => {
  try {
    const data = await analyticsService.getDepartmentStats();

    res.json({ data });
  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch department statistics'
    });
  }
};

/**
 * Get detailed department-level analytics breakdown
 */
const getDepartmentBreakdown = async (req, res) => {
  try {
    const data = await analyticsService.getDepartmentBreakdown();

    res.json({ data });
  } catch (error) {
    logger.error('Get department breakdown error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch department breakdown'
    });
  }
};

/**
 * Get feedback statistics
 */
const getFeedbackStats = async (req, res) => {
  try {
    const data = await analyticsService.getFeedbackStats();

    res.json({ data });
  } catch (error) {
    logger.error('Get feedback stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch feedback statistics'
    });
  }
};

/**
 * Get cross-department statistics
 */
const getCrossDepartmentStats = async (req, res) => {
  try {
    const data = await analyticsService.getCrossDepartmentStats();

    res.json({ data });
  } catch (error) {
    logger.error('Get cross-department stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch cross-department statistics'
    });
  }
};

/**
 * Get cross-seniority statistics
 */
const getCrossSeniorityStats = async (req, res) => {
  try {
    const data = await analyticsService.getCrossSeniorityStats();

    res.json({ data });
  } catch (error) {
    logger.error('Get cross-seniority stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch cross-seniority statistics'
    });
  }
};

/**
 * Get user satisfaction trends over time
 */
const getSatisfactionTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const data = await analyticsService.getSatisfactionTrends(parseInt(months, 10));

    res.json({ data });
  } catch (error) {
    logger.error('Get satisfaction trends error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch satisfaction trends'
    });
  }
};

/**
 * Get engagement leaderboard
 */
const getEngagementLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const data = await analyticsService.getEngagementLeaderboard(parseInt(limit, 10));

    res.json({ data });
  } catch (error) {
    logger.error('Get engagement leaderboard error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch engagement leaderboard'
    });
  }
};

/**
 * Get recent activity feed
 */
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const data = await analyticsService.getRecentActivity(parseInt(limit, 10));

    res.json({ data });
  } catch (error) {
    logger.error('Get recent activity error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch recent activity'
    });
  }
};

/**
 * Export users data to CSV
 */
const exportUsers = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.id} requested users export`);

    const users = await User.findAll({
      include: [
        {
          association: 'department',
          attributes: ['name']
        }
      ]
    });

    const data = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      department: user.department ? user.department.name : '',
      role: user.role || '',
      seniorityLevel: user.seniority_level || '',
      isActive: user.is_active ? 'Yes' : 'No',
      isOptedIn: user.is_opted_in ? 'Yes' : 'No',
      createdAt: user.created_at
    }));

    const csv = jsonToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Export users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export users'
    });
  }
};

/**
 * Export pairings data to CSV
 */
const exportPairings = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.id} requested pairings export`);

    const pairings = await Pairing.findAll({
      include: [
        {
          association: 'matchingRound',
          attributes: ['name', 'scheduled_date']
        },
        {
          association: 'user1',
          attributes: ['first_name', 'last_name', 'email'],
          include: [{ association: 'department', attributes: ['name'] }]
        },
        {
          association: 'user2',
          attributes: ['first_name', 'last_name', 'email'],
          include: [{ association: 'department', attributes: ['name'] }]
        }
      ]
    });

    const data = pairings.map(pairing => ({
      id: pairing.id,
      round: pairing.matchingRound ? pairing.matchingRound.name : '',
      roundDate: pairing.matchingRound ? pairing.matchingRound.scheduled_date : '',
      user1Name: `${pairing.user1.first_name} ${pairing.user1.last_name}`,
      user1Email: pairing.user1.email,
      user1Department: pairing.user1.department ? pairing.user1.department.name : '',
      user2Name: `${pairing.user2.first_name} ${pairing.user2.last_name}`,
      user2Email: pairing.user2.email,
      user2Department: pairing.user2.department ? pairing.user2.department.name : '',
      status: pairing.status,
      meetingScheduledAt: pairing.meeting_scheduled_at || '',
      meetingCompletedAt: pairing.meeting_completed_at || '',
      createdAt: pairing.created_at
    }));

    const csv = jsonToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pairings.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Export pairings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export pairings'
    });
  }
};

/**
 * Export feedback data to CSV
 */
const exportFeedback = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.id} requested feedback export`);

    const feedbacks = await MeetingFeedback.findAll({
      include: [
        {
          association: 'user',
          attributes: ['first_name', 'last_name', 'email']
        },
        {
          association: 'pairing',
          attributes: ['id'],
          include: [
            {
              association: 'matchingRound',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    const data = feedbacks.map(feedback => ({
      id: feedback.id,
      userName: `${feedback.user.first_name} ${feedback.user.last_name}`,
      userEmail: feedback.user.email,
      round: feedback.pairing?.matchingRound ? feedback.pairing.matchingRound.name : '',
      pairingId: feedback.pairing_id,
      rating: feedback.rating,
      comments: feedback.comments || '',
      createdAt: feedback.created_at
    }));

    const csv = jsonToCSV(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Export feedback error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export feedback'
    });
  }
};

/**
 * Export analytics summary to JSON
 */
const exportAnalyticsSummary = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.id} requested analytics summary export`);

    const [
      overview,
      departmentStats,
      feedbackStats,
      crossDepartmentStats,
      participationTrends,
      completionTrends
    ] = await Promise.all([
      analyticsService.getOverviewStats(),
      analyticsService.getDepartmentStats(),
      analyticsService.getFeedbackStats(),
      analyticsService.getCrossDepartmentStats(),
      analyticsService.getParticipationTrends(12),
      analyticsService.getCompletionTrends(12)
    ]);

    const summary = {
      generatedAt: new Date().toISOString(),
      overview,
      departments: departmentStats,
      feedback: feedbackStats,
      crossDepartment: crossDepartmentStats,
      trends: {
        participation: participationTrends,
        completion: completionTrends
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-summary.json');
    res.json(summary);
  } catch (error) {
    logger.error('Export analytics summary error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export analytics summary'
    });
  }
};

module.exports = {
  getOverview,
  getParticipationTrends,
  getCompletionTrends,
  getDepartmentStats,
  getDepartmentBreakdown,
  getFeedbackStats,
  getCrossDepartmentStats,
  getCrossSeniorityStats,
  getSatisfactionTrends,
  getEngagementLeaderboard,
  getRecentActivity,
  exportUsers,
  exportPairings,
  exportFeedback,
  exportAnalyticsSummary
};
