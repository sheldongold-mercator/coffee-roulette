import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { analyticsAPI } from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#0284c7', '#d946ef', '#10b981', '#f59e0b', '#ef4444'];

const Analytics = () => {
  const { data: departmentStats, isLoading: deptLoading } = useQuery(
    ['department-stats', 'v2'],
    () => analyticsAPI.getDepartmentStats()
  );

  const { data: feedbackStats, isLoading: feedbackLoading } = useQuery(
    ['feedback-stats', 'v2'],
    () => analyticsAPI.getFeedbackStats()
  );

  const { data: crossDeptStats, isLoading: crossLoading } = useQuery(
    ['cross-department-stats', 'v2'],
    () => analyticsAPI.getCrossDepartmentStats()
  );

  const { data: crossSeniorityStats, isLoading: crossSeniorityLoading } = useQuery(
    ['cross-seniority-stats', 'v2'],
    () => analyticsAPI.getCrossSeniorityStats()
  );

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery(
    ['engagement-leaderboard', 'v2'],
    () => analyticsAPI.getEngagementLeaderboard(10)
  );

  const handleExport = async (type) => {
    try {
      toast.loading(`Exporting ${type}...`);
      let response;

      switch (type) {
        case 'users':
          response = await analyticsAPI.exportUsers();
          break;
        case 'pairings':
          response = await analyticsAPI.exportPairings();
          break;
        case 'feedback':
          response = await analyticsAPI.exportFeedback();
          break;
        case 'summary':
          response = await analyticsAPI.exportSummary();
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.dismiss();
      toast.success('Export downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to export ${type}`);
    }
  };

  // Handle axios response wrapper: response.data.data
  const deptData = Array.isArray(departmentStats?.data?.data)
    ? departmentStats.data.data
    : Array.isArray(departmentStats?.data)
    ? departmentStats.data
    : Array.isArray(departmentStats?.departments)
    ? departmentStats.departments
    : [];
  const feedbackData = feedbackStats?.data?.data || feedbackStats?.data || feedbackStats?.feedback || {};
  const crossDept = crossDeptStats?.data?.data || crossDeptStats?.data || crossDeptStats?.crossDepartment || {};
  const crossSeniority = crossSeniorityStats?.data?.data || crossSeniorityStats?.data || {};
  const leaders = Array.isArray(leaderboard?.data?.data)
    ? leaderboard.data.data
    : Array.isArray(leaderboard?.data)
    ? leaderboard.data
    : Array.isArray(leaderboard?.leaderboard)
    ? leaderboard.leaderboard
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Detailed insights and data exports
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('users')}
            className="btn btn-secondary btn-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Users
          </button>
          <button
            onClick={() => handleExport('pairings')}
            className="btn btn-secondary btn-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Pairings
          </button>
          <button
            onClick={() => handleExport('feedback')}
            className="btn btn-secondary btn-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Feedback
          </button>
        </div>
      </motion.div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Department Participation
            </h2>
          </div>
          {deptLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="participationRate" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Feedback Distribution
            </h2>
          </div>
          {feedbackLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feedbackData.ratingDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.rating}★: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(feedbackData.ratingDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Cross-Department Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-accent-50 rounded-lg">
            <ChartBarIcon className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cross-Department Connections
            </h2>
            <p className="text-sm text-gray-600">
              Measuring collaboration across teams
            </p>
          </div>
        </div>
        {crossLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {crossDept.totalCrossDeptPairings || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Cross-Department Pairings
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {crossDept.crossDeptPercentage || 0}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Of All Pairings
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {crossDept.avgRating || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Average Rating
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Cross-Seniority Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-lg">
            <UserGroupIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cross-Seniority Connections
            </h2>
            <p className="text-sm text-gray-600">
              Bridging experience levels across the organization
            </p>
          </div>
        </div>
        {crossSeniorityLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {crossSeniority.crossSeniorityPairings || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Cross-Seniority Pairings
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {crossSeniority.crossSeniorityRate || 0}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Of All Pairings
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">
                {crossSeniority.sameSeniorityPairings || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Same-Seniority Pairings
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Engagement Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-yellow-50 rounded-lg">
            <TrophyIcon className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Engagement Leaderboard
            </h2>
            <p className="text-sm text-gray-600">
              Top participants this month
            </p>
          </div>
        </div>
        {leaderboardLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 animate-shimmer rounded"></div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No leaderboard data available
          </p>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : index === 1
                        ? 'bg-gray-200 text-gray-700'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{leader.name}</p>
                    <p className="text-sm text-gray-500">{leader.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{leader.totalPairings}</p>
                  <p className="text-xs text-gray-500">pairings</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics;
