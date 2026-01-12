const { User, Department, MatchingRound, Pairing, MeetingFeedback, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get overview statistics
   */
  async getOverviewStats() {
    try {
      // Calculate grace period cutoff (48 hours ago)
      const gracePeriodCutoff = new Date();
      gracePeriodCutoff.setHours(gracePeriodCutoff.getHours() - 48);

      const [
        totalUsers,
        activeUsers,
        optedInUsers,
        eligibleUsers,
        totalDepartments,
        activeDepartments,
        totalRounds,
        totalPairings,
        completedMeetings,
        feedbackCount
      ] = await Promise.all([
        User.count(),
        User.count({ where: { is_active: true } }),
        User.count({ where: { is_active: true, is_opted_in: true } }),
        // Eligible users: active, opted-in, past grace period, in active department
        User.count({
          where: {
            is_active: true,
            is_opted_in: true,
            [Op.or]: [
              { skip_grace_period: true },
              { opted_in_at: { [Op.lte]: gracePeriodCutoff } }
            ]
          },
          include: [{
            association: 'department',
            where: { is_active: true },
            required: true
          }]
        }),
        Department.count(),
        Department.count({ where: { is_active: true } }),
        MatchingRound.count({ where: { status: 'completed' } }),
        Pairing.count(),
        Pairing.count({ where: { status: 'completed' } }),
        MeetingFeedback.count()
      ]);

      const participationRate = activeUsers > 0
        ? Math.round((optedInUsers / activeUsers) * 100)
        : 0;

      const completionRate = totalPairings > 0
        ? Math.round((completedMeetings / totalPairings) * 100)
        : 0;

      const feedbackRate = completedMeetings > 0
        ? Math.round((feedbackCount / (completedMeetings * 2)) * 100) // *2 because 2 users per meeting
        : 0;

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          optedIn: optedInUsers,
          eligible: eligibleUsers,
          participationRate
        },
        departments: {
          total: totalDepartments,
          active: activeDepartments
        },
        matching: {
          totalRounds,
          totalPairings,
          avgPairingsPerRound: totalRounds > 0 ? Math.round(totalPairings / totalRounds) : 0
        },
        engagement: {
          completedMeetings,
          completionRate,
          feedbackCount,
          feedbackRate
        }
      };
    } catch (error) {
      logger.error('Error getting overview stats:', error);
      throw error;
    }
  }

  /**
   * Get participation trends over time
   */
  async getParticipationTrends(months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const rounds = await MatchingRound.findAll({
        where: {
          status: 'completed',
          executed_at: {
            [Op.gte]: startDate
          }
        },
        order: [['executed_at', 'ASC']],
        attributes: ['id', 'name', 'executed_at', 'total_participants', 'total_pairings']
      });

      const trends = rounds.map(round => ({
        roundId: round.id,
        roundName: round.name,
        date: round.executed_at,
        participants: round.total_participants,
        pairings: round.total_pairings
      }));

      return trends;
    } catch (error) {
      logger.error('Error getting participation trends:', error);
      throw error;
    }
  }

  /**
   * Get completion rate trends
   */
  async getCompletionTrends(months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const rounds = await MatchingRound.findAll({
        where: {
          status: 'completed',
          executed_at: {
            [Op.gte]: startDate
          }
        },
        include: [
          {
            association: 'pairings',
            attributes: ['status']
          }
        ],
        order: [['executed_at', 'ASC']]
      });

      const trends = rounds.map(round => {
        const totalPairings = round.pairings.length;
        const completedPairings = round.pairings.filter(p => p.status === 'completed').length;
        const completionRate = totalPairings > 0
          ? Math.round((completedPairings / totalPairings) * 100)
          : 0;

        return {
          roundId: round.id,
          roundName: round.name,
          date: round.executed_at,
          totalPairings,
          completedPairings,
          completionRate
        };
      });

      return trends;
    } catch (error) {
      logger.error('Error getting completion trends:', error);
      throw error;
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats() {
    try {
      const departments = await Department.findAll({
        include: [
          {
            association: 'users',
            attributes: ['id', 'is_active', 'is_opted_in']
          }
        ]
      });

      const stats = departments.map(dept => {
        const totalUsers = dept.users.length;
        const activeUsers = dept.users.filter(u => u.is_active).length;
        const optedInUsers = dept.users.filter(u => u.is_active && u.is_opted_in).length;
        const participationRate = activeUsers > 0
          ? Math.round((optedInUsers / activeUsers) * 100)
          : 0;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          isActive: dept.is_active,
          totalUsers,
          activeUsers,
          optedInUsers,
          participationRate,
          enrollmentDate: dept.enrollment_date
        };
      });

      return stats.sort((a, b) => b.optedInUsers - a.optedInUsers);
    } catch (error) {
      logger.error('Error getting department stats:', error);
      throw error;
    }
  }

  /**
   * Get feedback summary statistics
   */
  async getFeedbackStats() {
    try {
      const feedbacks = await MeetingFeedback.findAll({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalFeedback'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating >= 4 THEN 1 END')), 'positiveCount'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating <= 2 THEN 1 END')), 'negativeCount']
        ],
        raw: true
      });

      const ratingDistribution = await MeetingFeedback.findAll({
        attributes: [
          'rating',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['rating'],
        raw: true
      });

      const totalFeedback = parseInt(feedbacks[0].totalFeedback) || 0;

      return {
        averageRating: parseFloat(feedbacks[0].avgRating || 0).toFixed(2),
        totalFeedback,
        positiveCount: parseInt(feedbacks[0].positiveCount) || 0,
        negativeCount: parseInt(feedbacks[0].negativeCount) || 0,
        positiveRate: totalFeedback > 0
          ? Math.round((parseInt(feedbacks[0].positiveCount) / totalFeedback) * 100)
          : 0,
        ratingDistribution: ratingDistribution.map(r => ({
          rating: r.rating,
          count: parseInt(r.count)
        }))
      };
    } catch (error) {
      logger.error('Error getting feedback stats:', error);
      throw error;
    }
  }

  /**
   * Get cross-department pairing statistics
   */
  async getCrossDepartmentStats() {
    try {
      const pairings = await Pairing.findAll({
        include: [
          {
            association: 'user1',
            attributes: ['department_id'],
            include: [{ association: 'department', attributes: ['name'] }]
          },
          {
            association: 'user2',
            attributes: ['department_id'],
            include: [{ association: 'department', attributes: ['name'] }]
          }
        ]
      });

      const totalPairings = pairings.length;
      const crossDepartmentPairings = pairings.filter(p =>
        p.user1.department_id !== p.user2.department_id
      ).length;

      const crossDepartmentRate = totalPairings > 0
        ? Math.round((crossDepartmentPairings / totalPairings) * 100)
        : 0;

      return {
        totalPairings,
        crossDepartmentPairings,
        sameDepartmentPairings: totalPairings - crossDepartmentPairings,
        crossDepartmentRate
      };
    } catch (error) {
      logger.error('Error getting cross-department stats:', error);
      throw error;
    }
  }

  /**
   * Get cross-seniority pairing statistics
   */
  async getCrossSeniorityStats() {
    try {
      const pairings = await Pairing.findAll({
        include: [
          {
            association: 'user1',
            attributes: ['seniority_level']
          },
          {
            association: 'user2',
            attributes: ['seniority_level']
          }
        ]
      });

      const totalPairings = pairings.length;
      const crossSeniorityPairings = pairings.filter(p =>
        p.user1?.seniority_level && p.user2?.seniority_level &&
        p.user1.seniority_level !== p.user2.seniority_level
      ).length;

      const crossSeniorityRate = totalPairings > 0
        ? Math.round((crossSeniorityPairings / totalPairings) * 100)
        : 0;

      return {
        totalPairings,
        crossSeniorityPairings,
        sameSeniorityPairings: totalPairings - crossSeniorityPairings,
        crossSeniorityRate
      };
    } catch (error) {
      logger.error('Error getting cross-seniority stats:', error);
      throw error;
    }
  }

  /**
   * Get engagement leaderboard (most active users by pairing count)
   */
  async getEngagementLeaderboard(limit = 10) {
    try {
      // Get all users with their pairing counts
      const users = await User.findAll({
        where: { is_active: true },
        attributes: ['id', 'first_name', 'last_name'],
        include: [
          {
            association: 'department',
            attributes: ['name']
          }
        ]
      });

      // Count pairings for each user
      const userPairings = await Promise.all(
        users.map(async (user) => {
          const pairingCount = await Pairing.count({
            where: {
              [Op.or]: [
                { user1_id: user.id },
                { user2_id: user.id }
              ]
            }
          });

          return {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            department: user.department?.name || 'No department',
            totalPairings: pairingCount
          };
        })
      );

      // Sort by pairings and return top users
      const leaderboard = userPairings
        .filter(u => u.totalPairings > 0)
        .sort((a, b) => b.totalPairings - a.totalPairings)
        .slice(0, limit);

      return leaderboard;
    } catch (error) {
      logger.error('Error getting engagement leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit = 20) {
    try {
      const [recentRounds, recentFeedbacks, recentOptIns] = await Promise.all([
        MatchingRound.findAll({
          where: { status: 'completed' },
          order: [['executed_at', 'DESC']],
          limit: Math.floor(limit / 3),
          attributes: ['id', 'name', 'executed_at', 'total_pairings']
        }),
        MeetingFeedback.findAll({
          order: [['created_at', 'DESC']],
          limit: Math.floor(limit / 3),
          include: [
            {
              association: 'user',
              attributes: ['first_name', 'last_name']
            },
            {
              association: 'pairing',
              attributes: ['id']
            }
          ]
        }),
        User.findAll({
          where: {
            is_opted_in: true,
            updated_at: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          order: [['updated_at', 'DESC']],
          limit: Math.floor(limit / 3),
          attributes: ['first_name', 'last_name', 'updated_at']
        })
      ]);

      const activities = [];

      // Add matching rounds
      recentRounds.forEach(round => {
        activities.push({
          type: 'matching_round',
          timestamp: round.executed_at,
          description: `Matching round "${round.name}" created ${round.total_pairings} pairings`,
          data: { roundId: round.id, roundName: round.name, pairings: round.total_pairings }
        });
      });

      // Add feedback submissions
      recentFeedbacks.forEach(feedback => {
        activities.push({
          type: 'feedback',
          timestamp: feedback.created_at,
          description: `${feedback.user.first_name} ${feedback.user.last_name} submitted feedback (${feedback.rating}/5)`,
          data: { rating: feedback.rating, pairingId: feedback.pairing_id }
        });
      });

      // Add opt-ins
      recentOptIns.forEach(user => {
        activities.push({
          type: 'opt_in',
          timestamp: user.updated_at,
          description: `${user.first_name} ${user.last_name} opted into Coffee Roulette`,
          data: {}
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return activities.slice(0, limit);
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
