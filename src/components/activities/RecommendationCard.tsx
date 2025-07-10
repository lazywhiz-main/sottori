'use client';

import React from 'react';
import { ActivityRecommendation, ActivityType } from '@/lib/types/personalization';

interface RecommendationCardProps {
  recommendation: ActivityRecommendation;
  onAdd: (templateId: string) => void;
  onSkip: (templateId: string) => void;
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

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAdd,
  onSkip
}) => {
  const { template, relevance_score, reason, is_already_added } = recommendation;

  if (is_already_added) {
    return null; // 追加済みの場合は表示しない
  }

  return (
    <div className="bg-white border border-yellow-200 rounded-lg p-3 mb-2 flex items-center gap-2 transition-all duration-250 hover:border-yellow-300 hover:shadow-md">
      <span className={`text-xs rounded-md px-2 py-1 font-medium flex-shrink-0 ${getTypeColor(template.type)}`}>
        {template.type}
      </span>
      
      <span className="flex-1 text-sm text-gray-900">
        {template.content}
      </span>
      
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onAdd(template.id)}
          className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          追加
        </button>
        <button
          onClick={() => onSkip(template.id)}
          className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
        >
          スキップ
        </button>
      </div>
    </div>
  );
}; 