const { User, MatchingRound, Pairing, Department, SystemSetting, IcebreakerTopic, PairingIcebreaker } = require('../models');
const { Op } = require('sequelize');
const { shuffleArray, getRandomItems } = require('../utils/helpers');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');
const calendarService = require('./calendarService');

class MatchingService {
  /**
   * Get system setting value
   */
  async getSetting(key, defaultValue) {
    try {
      const setting = await SystemSetting.findOne({ where: { setting_key: key } });
      if (!setting) return defaultValue;
      return setting.getValue();
    } catch (error) {
      logger.error(`Error getting setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get eligible participants for matching
   * Checks: active, opted_in, grace period, available_from, department status
   */
  async getEligibleParticipants() {
    // Get grace period setting (in hours), default to 48 hours
    const gracePeriodHours = await this.getSetting('matching.grace_period_hours', 48);
    const gracePeriodCutoff = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // First, get all opted-in active users
    const users = await User.findAll({
      where: {
        is_active: true,
        is_opted_in: true
      },
      include: [
        {
          association: 'department',
          required: false // Allow users without department or with inactive department (if override is set)
        }
      ]
    });

    // Filter eligible participants based on all criteria
    const eligible = users.filter(user => {
      // Check available_from date (must be null or <= today)
      if (user.available_from && user.available_from > today) {
        return false;
      }

      // Check department status (with override support)
      const deptActive = user.department && user.department.is_active;
      if (!deptActive && !user.override_department_exclusion) {
        return false;
      }

      // Check grace period (with skip_grace_period override)
      if (!user.skip_grace_period && user.opted_in_at && new Date(user.opted_in_at) > gracePeriodCutoff) {
        return false;
      }

      return true;
    });

    logger.info(`Found ${eligible.length} eligible participants for matching (grace period: ${gracePeriodHours}h)`);
    return eligible;
  }

  /**
   * Get recent pairings for lookback period
   */
  async getRecentPairings(lookbackRounds = 3) {
    const recentRounds = await MatchingRound.findAll({
      where: {
        status: 'completed'
      },
      order: [['executed_at', 'DESC']],
      limit: lookbackRounds,
      include: [
        {
          association: 'pairings',
          attributes: ['user1_id', 'user2_id']
        }
      ]
    });

    const pairings = [];
    recentRounds.forEach(round => {
      round.pairings.forEach(pairing => {
        pairings.push({
          user1_id: pairing.user1_id,
          user2_id: pairing.user2_id,
          roundId: round.id
        });
      });
    });

    logger.info(`Found ${pairings.length} recent pairings across ${recentRounds.length} rounds`);
    return pairings;
  }

  /**
   * Count how many times two users were recently paired
   */
  countRecentMatches(user1Id, user2Id, recentPairings) {
    return recentPairings.filter(pairing => {
      return (
        (pairing.user1_id === user1Id && pairing.user2_id === user2Id) ||
        (pairing.user1_id === user2Id && pairing.user2_id === user1Id)
      );
    }).length;
  }

  /**
   * Check if two users are compatible based on their matching preferences
   */
  areMatchingPreferencesCompatible(user1, user2) {
    const pref1 = user1.matching_preference || 'any';
    const pref2 = user2.matching_preference || 'any';

    const sameDept = user1.department_id === user2.department_id;
    const sameSeniority = user1.seniority_level === user2.seniority_level;

    // Check user1's preference
    if (pref1 === 'cross_department_only' && sameDept) return false;
    if (pref1 === 'same_department_only' && !sameDept) return false;
    if (pref1 === 'cross_seniority_only' && sameSeniority) return false;

    // Check user2's preference
    if (pref2 === 'cross_department_only' && sameDept) return false;
    if (pref2 === 'same_department_only' && !sameDept) return false;
    if (pref2 === 'cross_seniority_only' && sameSeniority) return false;

    return true;
  }

  /**
   * Calculate match score between two users
   */
  async calculateMatchScore(user1, user2, recentPairings, settings) {
    // First check if preferences allow this match
    if (!this.areMatchingPreferencesCompatible(user1, user2)) {
      return -Infinity; // Incompatible preferences
    }

    let score = 100; // Base score

    // Penalty for recent pairing (stronger for more recent)
    const timesMatched = this.countRecentMatches(user1.id, user2.id, recentPairings);
    const repeatPenalty = settings.repeatPenalty || 50;
    score -= timesMatched * repeatPenalty;

    // Bonus for cross-department matching
    if (user1.department_id !== user2.department_id) {
      const crossDeptWeight = settings.crossDepartmentWeight || 20;
      score += crossDeptWeight;
    }

    // Bonus for cross-seniority matching
    if (user1.seniority_level !== user2.seniority_level) {
      const crossSeniorityWeight = settings.crossSeniorityWeight || 10;
      score += crossSeniorityWeight;
    }

    return score;
  }

  /**
   * Run matching algorithm to create pairings
   */
  async runMatchingAlgorithm(roundId, previewOnly = false, transaction = null) {
    try {
      logger.info(`${previewOnly ? 'Previewing' : 'Running'} matching algorithm for round ${roundId}`);

      // Get settings
      const lookbackRounds = await this.getSetting('matching.lookback_rounds', 3);
      const crossDepartmentWeight = await this.getSetting('matching.cross_department_weight', 20);
      const crossSeniorityWeight = await this.getSetting('matching.cross_seniority_weight', 10);
      const repeatPenalty = await this.getSetting('matching.repeat_penalty', 50);

      const settings = {
        lookbackRounds,
        crossDepartmentWeight,
        crossSeniorityWeight,
        repeatPenalty
      };

      // 1. Get eligible participants
      const participants = await this.getEligibleParticipants();

      if (participants.length < 2) {
        throw new Error('Not enough eligible participants for matching (minimum 2 required)');
      }

      // 2. Get recent pairings for constraint checking
      const recentPairings = await this.getRecentPairings(lookbackRounds);

      // 3. Shuffle participants for randomness
      const shuffled = shuffleArray(participants);

      // 4. Create pairings using greedy algorithm with scoring
      const pairings = [];
      const used = new Set();

      for (let i = 0; i < shuffled.length; i++) {
        if (used.has(shuffled[i].id)) continue;

        let bestMatch = null;
        let bestScore = -Infinity;

        // Find best match for this user
        for (let j = i + 1; j < shuffled.length; j++) {
          if (used.has(shuffled[j].id)) continue;

          const score = await this.calculateMatchScore(
            shuffled[i],
            shuffled[j],
            recentPairings,
            settings
          );

          if (score > bestScore) {
            bestScore = score;
            bestMatch = shuffled[j];
          }
        }

        // Create pairing if match found
        if (bestMatch) {
          pairings.push({
            matching_round_id: roundId,
            user1_id: shuffled[i].id,
            user2_id: bestMatch.id,
            user1: shuffled[i],
            user2: bestMatch,
            score: bestScore,
            status: 'pending'
          });

          used.add(shuffled[i].id);
          used.add(bestMatch.id);
        }
      }

      // 5. Handle odd person out (VIPs should never sit out)
      let unpaired = null;
      if (participants.length % 2 !== 0) {
        // Find the unpaired user
        const unpairedUser = participants.find(p => !used.has(p.id));

        // If the unpaired user is a VIP, we need to swap them with a non-VIP from a pairing
        if (unpairedUser && unpairedUser.is_vip) {
          // Find a pairing where we can swap out a non-VIP
          let swapped = false;
          for (const pairing of pairings) {
            const user1IsVip = pairing.user1.is_vip;
            const user2IsVip = pairing.user2.is_vip;

            // If either user in the pairing is not a VIP, swap them out
            if (!user1IsVip) {
              // Swap user1 with the VIP
              unpaired = pairing.user1;
              pairing.user1_id = unpairedUser.id;
              pairing.user1 = unpairedUser;
              swapped = true;
              logger.info(`VIP user ${unpairedUser.id} swapped into pairing, non-VIP user ${unpaired.id} will sit out`);
              break;
            } else if (!user2IsVip) {
              // Swap user2 with the VIP
              unpaired = pairing.user2;
              pairing.user2_id = unpairedUser.id;
              pairing.user2 = unpairedUser;
              swapped = true;
              logger.info(`VIP user ${unpairedUser.id} swapped into pairing, non-VIP user ${unpaired.id} will sit out`);
              break;
            }
          }

          // If we couldn't swap (all participants are VIPs), the original unpaired stays
          if (!swapped) {
            unpaired = unpairedUser;
            logger.warn(`All participants are VIPs - VIP user ${unpaired.id} will sit out this round`);
          }
        } else {
          unpaired = unpairedUser;
          logger.info(`Odd number of participants - user ${unpaired?.id} will sit out this round`);
        }
      }

      logger.info(`Created ${pairings.length} pairings for round ${roundId}`);

      // 6. Save pairings to database if not preview
      if (!previewOnly) {
        const savedPairings = await this.savePairings(roundId, pairings, transaction);

        // 7. Assign icebreaker topics (within transaction)
        await this.assignIcebreakers(savedPairings, 3, transaction);

        // Note: scheduleMeetingsForPairings and queueNotificationsForPairings
        // are called AFTER transaction commit in createAndExecuteRound
        // because they need to look up the committed pairing records

        return {
          pairings: savedPairings,
          totalParticipants: participants.length,
          totalPairings: pairings.length,
          unpaired: unpaired ? {
            id: unpaired.id,
            email: unpaired.email,
            firstName: unpaired.first_name,
            lastName: unpaired.last_name
          } : null
        };
      }

      // Return preview data
      return {
        pairings: pairings.map(p => ({
          user1: {
            id: p.user1.id,
            email: p.user1.email,
            firstName: p.user1.first_name,
            lastName: p.user1.last_name,
            department: p.user1.department?.name || 'No Department',
            seniorityLevel: p.user1.seniority_level
          },
          user2: {
            id: p.user2.id,
            email: p.user2.email,
            firstName: p.user2.first_name,
            lastName: p.user2.last_name,
            department: p.user2.department?.name || 'No Department',
            seniorityLevel: p.user2.seniority_level
          },
          score: p.score
        })),
        totalParticipants: participants.length,
        totalPairings: pairings.length,
        unpaired: unpaired ? {
          id: unpaired.id,
          email: unpaired.email,
          firstName: unpaired.first_name,
          lastName: unpaired.last_name
        } : null,
        settings
      };
    } catch (error) {
      logger.error('Matching algorithm error:', error);
      throw error;
    }
  }

  /**
   * Save pairings to database
   */
  async savePairings(roundId, pairings, transaction = null) {
    const savedPairings = [];

    for (const pairing of pairings) {
      const saved = await Pairing.create({
        matching_round_id: roundId,
        user1_id: pairing.user1_id,
        user2_id: pairing.user2_id,
        status: 'pending'
      }, { transaction });

      savedPairings.push(saved);
    }

    logger.info(`Saved ${savedPairings.length} pairings to database`);
    return savedPairings;
  }

  /**
   * Assign random icebreaker topics to pairings
   */
  async assignIcebreakers(pairings, count = 3, transaction = null) {
    try {
      // Get all active icebreaker topics
      const allIcebreakers = await IcebreakerTopic.findAll({
        where: { is_active: true },
        transaction
      });

      if (allIcebreakers.length === 0) {
        logger.warn('No active icebreaker topics found');
        return;
      }

      // Assign random icebreakers to each pairing
      for (const pairing of pairings) {
        const selectedIcebreakers = getRandomItems(allIcebreakers, count);

        for (const icebreaker of selectedIcebreakers) {
          await PairingIcebreaker.create({
            pairing_id: pairing.id,
            icebreaker_id: icebreaker.id
          }, { transaction });
        }
      }

      logger.info(`Assigned icebreakers to ${pairings.length} pairings`);
    } catch (error) {
      logger.error('Error assigning icebreakers:', error);
      // Don't throw - icebreakers are nice to have but not critical
    }
  }

  /**
   * Queue notifications for pairings
   */
  async queueNotificationsForPairings(pairings) {
    try {
      for (const pairing of pairings) {
        // Queue immediate pairing notifications (email + Teams)
        await notificationService.queuePairingNotifications(pairing.id, ['email', 'teams']);

        // If meeting is scheduled, queue reminders and feedback
        if (pairing.meeting_scheduled_at) {
          // Queue 7-day reminder
          await notificationService.queueReminderNotifications(pairing.id, 7, ['email', 'teams']);

          // Queue 1-day reminder
          await notificationService.queueReminderNotifications(pairing.id, 1, ['email', 'teams']);

          // Queue feedback request (1 day after meeting)
          await notificationService.queueFeedbackNotifications(pairing.id, ['email', 'teams']);
        }
      }

      logger.info(`Queued notifications for ${pairings.length} pairings`);
    } catch (error) {
      logger.error('Error queueing notifications:', error);
      // Don't throw - notifications are important but shouldn't block pairing creation
    }
  }

  /**
   * Schedule meetings for pairings
   */
  async scheduleMeetingsForPairings(pairings) {
    try {
      const autoSchedule = await this.getSetting('matching.auto_schedule_meetings', true);

      if (!autoSchedule) {
        logger.info('Auto-scheduling disabled, skipping meeting creation');
        return;
      }

      for (const pairing of pairings) {
        try {
          // Get full user details with icebreakers
          const pairingWithDetails = await Pairing.findByPk(pairing.id, {
            include: [
              {
                association: 'user1',
                attributes: ['id', 'email', 'first_name', 'last_name']
              },
              {
                association: 'user2',
                attributes: ['id', 'email', 'first_name', 'last_name']
              },
              {
                association: 'icebreakers',
                attributes: ['topic'],
                through: { attributes: [] }
              }
            ]
          });

          const icebreakers = pairingWithDetails.icebreakers.map(ib => ib.topic);

          // Attempt to schedule meeting
          const result = await calendarService.scheduleMeeting(
            pairingWithDetails.user1.email,
            pairingWithDetails.user2.email,
            icebreakers
          );

          if (result.success) {
            // Update pairing with meeting details
            await pairing.update({
              meeting_scheduled_at: result.scheduledAt,
              outlook_event_id: result.eventId,
              teams_meeting_link: result.teamsLink
            });

            logger.info(`Meeting scheduled for pairing ${pairing.id}:`, {
              scheduledAt: result.scheduledAt,
              eventId: result.eventId
            });
          } else {
            logger.warn(`Could not auto-schedule meeting for pairing ${pairing.id}:`, result.message);
            // Pairing will remain without scheduled time - users can schedule manually
          }
        } catch (error) {
          logger.error(`Error scheduling meeting for pairing ${pairing.id}:`, error);
          // Continue with next pairing
        }
      }

      logger.info(`Completed meeting scheduling for ${pairings.length} pairings`);
    } catch (error) {
      logger.error('Error in scheduleMeetingsForPairings:', error);
      // Don't throw - scheduling failures shouldn't block the matching round
    }
  }

  /**
   * Create and execute a new matching round
   */
  async createAndExecuteRound(scheduledDate, name = null) {
    const transaction = await MatchingRound.sequelize.transaction();

    try {
      // Generate name if not provided
      if (!name) {
        const date = new Date(scheduledDate);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        name = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      }

      // Create matching round
      const round = await MatchingRound.create({
        name,
        scheduled_date: scheduledDate,
        status: 'in_progress'
      }, { transaction });

      logger.info(`Created matching round ${round.id}: ${name}`);

      // Run matching algorithm
      const result = await this.runMatchingAlgorithm(round.id, false, transaction);

      // Update round with results
      await round.update({
        status: 'completed',
        executed_at: new Date(),
        total_participants: result.totalParticipants,
        total_pairings: result.totalPairings
      }, { transaction });

      await transaction.commit();

      logger.info(`Successfully completed matching round ${round.id}`);

      // Post-commit: Schedule meetings and queue notifications
      // These need to run after commit because they look up the committed records
      if (result.pairings && result.pairings.length > 0) {
        try {
          await this.scheduleMeetingsForPairings(result.pairings);
        } catch (err) {
          logger.error('Error scheduling meetings (non-fatal):', err);
        }

        try {
          await this.queueNotificationsForPairings(result.pairings);
        } catch (err) {
          logger.error('Error queuing notifications (non-fatal):', err);
        }
      }

      return {
        round: {
          id: round.id,
          name: round.name,
          scheduledDate: round.scheduled_date,
          executedAt: round.executed_at,
          status: round.status,
          totalParticipants: round.total_participants,
          totalPairings: round.total_pairings
        },
        pairings: result.pairings,
        unpaired: result.unpaired
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating and executing matching round:', error);
      throw error;
    }
  }
}

module.exports = new MatchingService();
