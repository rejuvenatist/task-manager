import React, { useState } from 'react';
import { X, Calendar, Layers, Type, CheckCircle2 } from 'lucide-react';
import { TaskLevel, NewTaskInput, TaskStatus } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskInput) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState<TaskLevel>('大任务');
  // Default status
  const [status, setStatus] = useState<TaskStatus>('未完成');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      level,
      status,
      startDate,
      endDate
    });
    // Reset
    setName('');
    setLevel('大任务');
    setStatus('未完成');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#202020] w-full max-w-md rounded-lg shadow-2xl border border-[#2f2f2f] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f]">
          <h3 className="text-[#d4d4d4] font-medium">新建任务</h3>
          <button onClick={onClose} className="text-[#9b9b9b] hover:text-[#d4d4d4] hover:bg-[#373737] p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-xs text-[#9b9b9b] flex items-center gap-1">
              <Type size={12} /> 名称
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入任务名称..."
              className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Level Select */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#9b9b9b] flex items-center gap-1">
                <Layers size={12} /> 层级
              </label>
              <div className="relative">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as TaskLevel)}
                  className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="大任务">大任务</option>
                  <option value="中任务">中任务</option>
                  <option value="小任务">小任务</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-[#9b9b9b]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#9b9b9b] flex items-center gap-1">
                <CheckCircle2 size={12} /> 状态
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                >
                  <option value="未完成">未完成</option>
                  <option value="已完成">已完成</option>
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-[#9b9b9b]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#9b9b9b] flex items-center gap-1">
                <Calendar size={12} /> 开始日期
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#9b9b9b] flex items-center gap-1">
                <Calendar size={12} /> 结束日期
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#2c2c2c] border border-[#3f3f3f] text-[#d4d4d4] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-[#d4d4d4] hover:bg-[#373737] rounded transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors font-medium shadow-lg shadow-blue-900/20"
            >
              创建任务
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};