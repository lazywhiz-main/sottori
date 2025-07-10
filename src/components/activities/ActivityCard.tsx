'use client';

import React from 'react';
import { UserActivity, ActivityType } from '@/lib/types/personalization';

interface ActivityCardProps {
  activity: UserActivity;
  onEdit: (activity: UserActivity) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const getTypeColor = (type: ActivityType): string => {
  // 医療系と個人系で色分け
  const isMedical = ['診察', '検査'].includes(type);
  if (isMedical) {
    return 'bg-blue-100 text-blue-700';
  } else {
    return 'bg-orange-100 text-orange-700';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    case 'planned':
      return 'bg-gray-100 text-gray-600';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return '完了';
    case 'in_progress':
      return '進行中';
    case 'planned':
      return '予定';
    case 'cancelled':
      return 'キャンセル';
    default:
      return status;
  }
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    return date.toLocaleDateString('ja-JP');
  };

  const formatScheduledDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '明日';
    if (diffDays < 7) return `${diffDays}日後`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間後`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2 text-sm text-gray-900 flex items-center gap-2 transition-all duration-250 hover:transform hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
      <span className={`text-xs rounded-md px-2 py-1 font-medium flex-shrink-0 ${getTypeColor(activity.type)}`}>
        {activity.type}
      </span>
      
      <span className="flex-1 leading-relaxed">
        {activity.content}
      </span>
      
      <span className="text-xs text-gray-500 flex-shrink-0">
        {activity.scheduled_date ? formatScheduledDate(activity.scheduled_date) : formatDate(activity.created_at)}
      </span>
      
      <span className={`text-xs px-2 py-1 rounded-md flex-shrink-0 ${getStatusColor(activity.status)}`}>
        {getStatusText(activity.status)}
      </span>
      
      {activity.is_ai_recommended && (
        <span className="text-xs px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 flex-shrink-0">
          AIおすすめ
        </span>
      )}
      
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(activity)}
          className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}; 