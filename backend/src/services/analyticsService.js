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
   * Returns monthly aggregated data with participation rate
   */
  async getParticipationTrends(months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1); // Start from first of month
      startDate.setHours(0, 0, 0, 0);

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

      // Group rounds by month
      const monthlyData = {};
      rounds.forEach(round => {
        const date = new Date(round.executed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            participants: 0,
            pairings: 0,
            rounds: 0
          };
        }
        monthlyData[monthKey].participants += round.total_participants || 0;
        monthlyData[monthKey].pairings += round.total_pairings || 0;
        monthlyData[monthKey].rounds += 1;
      });

      // Generate all months in range and format for chart
      const allMonths = [];
      const currentDate = new Date();
      const tempDate = new Date(startDate);

      while (tempDate <= currentDate) {
        const monthKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = tempDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const data = monthlyData[monthKey];

        allMonths.push({
          month: monthLabel,
          monthKey: monthKey,
          participants: data ? data.participants : 0,
          pairings: data ? data.pairings : 0,
          rounds: data ? data.rounds : 0,
          // Use participants as the "rate" for chart compatibility
          rate: data ? data.participants : 0
        });

        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      return allMonths;
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
   * Get detailed department-level analytics breakdown
   * Includes participation rate, completion rate, feedback score, cross-dept connections
   * Uses aggregated queries to avoid N+1 problem
   */
  async getDepartmentBreakdown() {
    try {
      // Get department user stats in one query
      const departments = await Department.findAll({
        where: { is_active: true },
        include: [
          {
            association: 'users',
            attributes: ['id', 'is_active', 'is_opted_in']
          }
        ]
      });

      // Build department data structure
      const deptMap = {};
      const allUserIds = [];
      departments.forEach(dept => {
        const activeUsers = dept.users.filter(u => u.is_active);
        const userIds = activeUsers.map(u => u.id);
        allUserIds.push(...userIds);

        deptMap[dept.id] = {
          departmentId: dept.id,
          departmentName: dept.name,
          activeUsers: activeUsers.length,
          optedInUsers: dept.users.filter(u => u.is_active && u.is_opted_in).length,
          userIds: new Set(userIds),
          totalPairings: 0,
          completedPairings: 0,
          crossDeptPairings: 0,
          feedbackRatings: []
        };
      });

      // If no users, return empty results early
      if (allUserIds.length === 0) {
        return departments.map(dept => ({
          departmentId: dept.id,
          departmentName: dept.name,
          activeUsers: 0,
          optedInUsers: 0,
          participationRate: 0,
          totalPairings: 0,
          completedPairings: 0,
          completionRate: 0,
          crossDeptPairings: 0,
          crossDeptRate: 0,
          avgFeedbackRating: null,
          feedbackCount: 0
        }));
      }

      // Get all pairings involving any of our users in ONE query
      const pairings = await Pairing.findAll({
        where: {
          [Op.or]: [
            { user1_id: { [Op.in]: allUserIds } },
            { user2_id: { [Op.in]: allUserIds } }
          ]
        },
        include: [
          { association: 'user1', attributes: ['id', 'department_id'] },
          { association: 'user2', attributes: ['id', 'department_id'] },
          { association: 'feedback', attributes: ['rating'] }
        ]
      });

      // Process pairings and attribute to departments
      pairings.forEach(pairing => {
        const dept1Id = pairing.user1?.department_id;
        const dept2Id = pairing.user2?.department_id;
        const isCrossDept = dept1Id !== dept2Id;
        const isCompleted = pairing.status === 'completed';

        // Attribute pairing to each involved department
        [dept1Id, dept2Id].forEach(deptId => {
          if (deptId && deptMap[deptId]) {
            const dept = deptMap[deptId];
            // Only count if the user belongs to this department
            const user1InDept = dept.userIds.has(pairing.user1_id);
            const user2InDept = dept.userIds.has(pairing.user2_id);

            if (user1InDept || user2InDept) {
              dept.totalPairings++;
              if (isCompleted) dept.completedPairings++;
              if (isCrossDept) dept.crossDeptPairings++;

              // Collect feedback ratings
              if (pairing.feedback && pairing.feedback.length > 0) {
                pairing.feedback.forEach(fb => {
                  dept.feedbackRatings.push(fb.rating);
                });
              }
            }
          }
        });
      });

      // Build final results
      const breakdown = Object.values(deptMap).map(dept => {
        const avgRating = dept.feedbackRatings.length > 0
          ? (dept.feedbackRatings.reduce((a, b) => a + b, 0) / dept.feedbackRatings.length).toFixed(1)
          : null;

        return {
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          activeUsers: dept.activeUsers,
          optedInUsers: dept.optedInUsers,
          participationRate: dept.activeUsers > 0 ? Math.round((dept.optedInUsers / dept.activeUsers) * 100) : 0,
          totalPairings: dept.totalPairings,
          completedPairings: dept.completedPairings,
          completionRate: dept.totalPairings > 0 ? Math.round((dept.completedPairings / dept.totalPairings) * 100) : 0,
          crossDeptPairings: dept.crossDeptPairings,
          crossDeptRate: dept.totalPairings > 0 ? Math.round((dept.crossDeptPairings / dept.totalPairings) * 100) : 0,
          avgFeedbackRating: avgRating,
          feedbackCount: dept.feedbackRatings.length
        };
      });

      // Sort by participation rate descending
      return breakdown.sort((a, b) => b.participationRate - a.participationRate);
    } catch (error) {
      logger.error('Error getting department breakdown:', error);
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
   * Get user satisfaction trends over time
   * Returns average feedback ratings aggregated by month
   */
  async getSatisfactionTrends(months = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1); // Start from first of month
      startDate.setHours(0, 0, 0, 0);

      // Get all feedback in the date range
      const feedbacks = await MeetingFeedback.findAll({
        where: {
          created_at: {
            [Op.gte]: startDate
          }
        },
        attributes: ['rating', 'created_at'],
        order: [['created_at', 'ASC']]
      });

      // Group by month
      const monthlyData = {};
      feedbacks.forEach(feedback => {
        const date = new Date(feedback.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            ratings: [],
            count: 0
          };
        }
        monthlyData[monthKey].ratings.push(feedback.rating);
        monthlyData[monthKey].count++;
      });

      // Calculate averages and format for chart
      const trends = Object.values(monthlyData).map(data => ({
        month: data.month,
        monthLabel: new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        avgRating: parseFloat((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(2)),
        count: data.count,
        positive: data.ratings.filter(r => r >= 4).length,
        neutral: data.ratings.filter(r => r === 3).length,
        negative: data.ratings.filter(r => r <= 2).length
      }));

      // Fill in missing months with null values
      const allMonths = [];
      const currentDate = new Date();
      const tempDate = new Date(startDate);
      while (tempDate <= currentDate) {
        const monthKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
        const existing = trends.find(t => t.month === monthKey);
        allMonths.push(existing || {
          month: monthKey,
          monthLabel: tempDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          avgRating: null,
          count: 0,
          positive: 0,
          neutral: 0,
          negative: 0
        });
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      return allMonths;
    } catch (error) {
      logger.error('Error getting satisfaction trends:', error);
      throw error;
    }
  }

  /**
   * Get engagement leaderboard (most active users by pairing count)
   * Uses aggregated query to avoid N+1 problem
   */
  async getEngagementLeaderboard(limit = 10) {
    try {
      // Use raw SQL with UNION to count pairings for both user1 and user2 in a single query
      const [results] = await sequelize.query(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          d.name as department_name,
          COALESCE(pc.pairing_count, 0) as total_pairings
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as pairing_count
          FROM (
            SELECT user1_id as user_id FROM pairings
            UNION ALL
            SELECT user2_id as user_id FROM pairings
          ) as all_user_pairings
          GROUP BY user_id
        ) pc ON u.id = pc.user_id
        WHERE u.is_active = 1
          AND pc.pairing_count > 0
        ORDER BY total_pairings DESC
        LIMIT :limit
      `, {
        replacements: { limit },
        type: sequelize.QueryTypes.SELECT
      });

      const leaderboard = results.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        department: row.department_name || 'No department',
        totalPairings: parseInt(row.total_pairings, 10)
      }));

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
