'use client';

import { useState, useEffect } from 'react';
import { 
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'rebalance' | 'recommendation' | 'analysis' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  value?: number;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Simulate fetching recent AI activities
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'rebalance',
          title: 'Portfolio Rebalanced',
          description: 'AI automatically rebalanced your portfolio based on market conditions',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          status: 'completed',
          value: 1250.50
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'New Investment Opportunity',
          description: 'AI identified a potential opportunity in emerging crypto assets',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          status: 'pending'
        },
        {
          id: '3',
          type: 'analysis',
          title: 'Market Analysis Complete',
          description: 'AI completed daily market analysis and updated risk assessment',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          status: 'completed'
        },
        {
          id: '4',
          type: 'alert',
          title: 'High Volatility Alert',
          description: 'AI detected high volatility in your portfolio assets',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          status: 'completed'
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rebalance':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      case 'recommendation':
        return <SparklesIcon className="h-5 w-5 text-purple-500" />;
      case 'analysis':
        return <ChartBarIcon className="h-5 w-5 text-green-500" />;
      case 'alert':
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent AI Activity</h2>
        <p className="text-sm text-gray-500 mt-1">AI-powered actions and recommendations</p>
      </div>

      <div className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.value && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {formatCurrency(activity.value)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
