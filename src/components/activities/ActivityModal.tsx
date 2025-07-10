'use client';

import React, { useState, useEffect } from 'react';
import { UserActivity, UserActivityInsert, UserActivityUpdate, ActivityType, ActivityStatus, ActivityPriority } from '@/lib/types/personalization';
import { Button } from '@/components/ui/Button';

interface ActivityModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  stepId?: number;
  activity?: UserActivity;
  onClose: () => void;
  onSubmit: (data: UserActivityInsert | UserActivityUpdate) => Promise<void>;
}

const stepNames = {
  1: '診断・検査',
  2: '治療方針決定',
  3: '手術・治療',
  4: '術後ケア',
  5: 'フォローアップ'
};

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  mode,
  stepId,
  activity,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    type: '準備' as ActivityType,
    content: '',
    description: '',
    scheduled_date: '',
    status: 'planned' as ActivityStatus,
    priority: 'normal' as ActivityPriority
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activity && mode === 'edit') {
      setFormData({
        type: activity.type,
        content: activity.content,
        description: activity.description || '',
        scheduled_date: activity.scheduled_date || '',
        status: activity.status,
        priority: activity.priority
      });
    } else {
      setFormData({
        type: '準備',
        content: '',
        description: '',
        scheduled_date: '',
        status: 'planned',
        priority: 'normal'
      });
    }
  }, [activity, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'create' && stepId) {
        await onSubmit({
          roadmap_step_id: stepId,
          ...formData
        } as UserActivityInsert);
      } else if (mode === 'edit' && activity) {
        await onSubmit(formData as UserActivityUpdate);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? 'アクティビティ追加' : 'アクティビティ編集'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {mode === 'create' && stepId && (
          <p className="text-sm text-gray-600 mb-4">
            ステップ: {stepNames[stepId as keyof typeof stepNames]}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種別 *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="診察">診察</option>
              <option value="検査">検査</option>
              <option value="準備">準備</option>
              <option value="家族相談">家族相談</option>
              <option value="メモ">メモ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容 *
            </label>
            <input
              type="text"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="アクティビティの内容を入力"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              詳細説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="詳細な説明があれば入力"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予定日
            </label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ActivityStatus })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">予定</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                優先度
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ActivityPriority })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">低</option>
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : mode === 'create' ? '追加' : '更新'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 