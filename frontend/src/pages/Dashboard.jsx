import React from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { analyticsAPI, userAPI, matchingAPI } from '../services/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, loading }) => {
  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 animate-shimmer rounded"></div>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
              {trend !== undefined && (
                <div className="mt-2 flex items-center gap-1">
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {Math.abs(trend)}%
                  </span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery(
    ['analytics-overview', 'v2'],
    () => analyticsAPI.getOverview()
  );

  const { data: userStats, isLoading: userStatsLoading } = useQuery(
    ['user-stats', 'v2'],
    () => userAPI.getUserStats()
  );

  const { data: participationTrends, isLoading: trendsLoading } = useQuery(
    ['participation-trends', 'v2'],
    () => analyticsAPI.getParticipationTrends(6)
  );

  const { data: recentActivity, isLoading: activityLoading } = useQuery(
    ['recent-activity', 'v2'],
    () => analyticsAPI.getRecentActivity(10)
  );

  const stats = overview?.data || {};
  const trends = participationTrends?.data || [];
  // Handle both old format (activities) and new format (data)
  const activities = Array.isArray(recentActivity?.data)
    ? recentActivity.data
    : Array.isArray(recentActivity?.activities)
    ? recentActivity.activities
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of Coffee Roulette system metrics and activity
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={UsersIcon}
          loading={overviewLoading}
        />
        <StatCard
          title="Active Departments"
          value={stats.activeDepartments || 0}
          icon={BuildingOfficeIcon}
          loading={overviewLoading}
        />
        <StatCard
          title="Participation Rate"
          value={`${stats.participationRate || 0}%`}
          icon={ChartBarIcon}
          trend={stats.participationTrend}
          loading={overviewLoading}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate || 0}%`}
          icon={CheckCircleIcon}
          trend={stats.completionTrend}
          loading={overviewLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation Trends */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Participation Trends
            </h2>
            <p className="text-sm text-gray-600">Last 6 months</p>
          </div>
          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorParticipation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorParticipation)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <p className="text-sm text-gray-600">Latest system events</p>
          </div>
          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-gray-200 rounded-full animate-shimmer"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 animate-shimmer rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 animate-shimmer rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No recent activity
                </p>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-2 h-2 mt-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary">
            Trigger Matching Round
          </button>
          <button className="btn btn-secondary">
            Sync Users from Microsoft
          </button>
          <button className="btn btn-secondary">
            Export Analytics Report
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
