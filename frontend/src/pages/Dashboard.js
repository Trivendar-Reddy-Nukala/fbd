// pages/Dashboard.js
import React from 'react';
import { useQuery } from 'react-query';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { userAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    userAPI.getDashboard,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-danger-600">Error loading dashboard data</p>
      </div>
    );
  }

  const { netWorth, totalIncome, totalSpending, recentTransactions, totalAccounts } = dashboardData || {};

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>
            {formatCurrency(value)}
          </p>
          {trend && (
            <div className="flex items-center mt-1">
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-success-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-danger-600" />
              )}
              <span className={`text-sm ml-1 ${
                trend === 'up' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Your financial overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Net Worth"
          value={netWorth || 0}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          color="primary"
        />
        <StatCard
          title="Total Income"
          value={totalIncome || 0}
          icon={TrendingUp}
          trend="up"
          trendValue="+8.2%"
          color="success"
        />
        <StatCard
          title="Total Spending"
          value={totalSpending || 0}
          icon={TrendingDown}
          trend="down"
          trendValue="-3.1%"
          color="danger"
        />
        <StatCard
          title="Total Accounts"
          value={totalAccounts || 0}
          icon={CreditCard}
          color="warning"
        />
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
        </div>
        {recentTransactions && recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.transaction_id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    transaction.amount > 0 
                      ? 'bg-success-100' 
                      : 'bg-danger-100'
                  }`}>
                    {transaction.amount > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-success-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-danger-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.account_name} • {transaction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount > 0 
                      ? 'text-success-600' 
                      : 'text-danger-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first transaction.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full btn-primary">
              Add New Account
            </button>
            <button className="w-full btn-secondary">
              Record Transaction
            </button>
            <button className="w-full btn-secondary">
              View Reports
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Financial Tips</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Consider setting up automatic savings transfers to build your emergency fund.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                📊 Review your spending patterns monthly to identify areas for improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 