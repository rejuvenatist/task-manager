import React, { useState, useEffect, useRef } from 'react';
import { FileText, Play, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { Task, TaskLevel, TaskStatus } from '../types';
import { formatDateRange } from '../utils/dateUtils';
import { DateRangePicker } from './DateRangePicker';

interface TaskRowProps {
  task: Task;
  onOpen: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  depth?: number;
}

const getLevelColor = (level: string) => {
  switch (level) {
    case '大任务': return 'bg-orange-900/50 text-orange-300 border-orange-800/50';
    case '中任务': return 'bg-blue-900/50 text-blue-300 border-blue-800/50';
    case '小任务': return 'bg-green-900/50 text-green-300 border-green-800/50';
    default: return 'bg-gray-800 text-gray-300';
  }
};

const getStatusStyle = (status: TaskStatus) => {
  if (status === '已完成') {
    // 浅灰背景，白边框
    return 'bg-[#373737] text-[#d4d4d4] border border-white';
  } else {
    // 浅灰背景，无边框(或透明边框)
    return 'bg-[#373737] text-[#9b9b9b] border border-transparent';
  }
};

export const TaskRow: React.FC<TaskRowProps> = ({ task, onOpen, onUpdate, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });

  // Level Picker State
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [levelMenuPos, setLevelMenuPos] = useState({ x: 0, y: 0 });
  const levelMenuRef = useRef<HTMLDivElement>(null);

  // Status Picker State
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusMenuPos, setStatusMenuPos] = useState({ x: 0, y: 0 });
  const statusMenuRef = useRef<HTMLDivElement>(null);
  
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  // Handle click outside for Level and Status Menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelMenuRef.current && !levelMenuRef.current.contains(event.target as Node)) {
        setShowLevelMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };

    if (showLevelMenu || showStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLevelMenu, showStatusMenu]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the side panel
    setIsExpanded(!isExpanded);
  };

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickPos({ x: e.clientX, y: e.clientY });
    setShowDatePicker(true);
  };

  const handleLevelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setLevelMenuPos({ x: rect.left, y: rect.bottom + 5 });
    setShowLevelMenu(true);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setStatusMenuPos({ x: rect.left, y: rect.bottom + 5 });
    setShowStatusMenu(true);
  };

  const handleLevelSelect = (level: TaskLevel) => {
    if (level !== task.level) {
      onUpdate(task.id, { level });
    }
    setShowLevelMenu(false);
  };

  const handleStatusSelect = (status: TaskStatus) => {
    if (status !== task.status) {
      onUpdate(task.id, { status });
    }
    setShowStatusMenu(false);
  };

  return (
    <>
      <div className="group flex border-b border-[#2f2f2f] hover:bg-[#252525] transition-colors text-sm min-w-full relative">
        
        {/* Name Column */}
        <div className="flex-1 min-w-[300px] border-r border-[#2f2f2f] p-0 flex items-center relative">
          
          {/* Hover Controls */}
          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[#5a5a5a] z-20 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <GripVertical size={14} className="cursor-grab hover:text-[#d4d4d4]" />
              <Play size={10} fill="currentColor" className="cursor-pointer hover:text-[#d4d4d4]" />
          </div>

          {/* Indentation and Content */}
          <div 
            className="flex items-center gap-2 py-2 pr-3 w-full"
            style={{ paddingLeft: `${depth * 24 + 36}px` }} 
          >
            {/* Toggle Triangle */}
            <div className="w-[20px] -ml-[24px] flex items-center justify-center shrink-0 z-30">
              {hasSubtasks && (
                <button 
                  onClick={handleToggle}
                  className="p-0.5 hover:bg-[#373737] rounded text-[#9b9b9b] transition-colors flex items-center justify-center"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
            </div>

            <FileText size={16} className="text-[#9b9b9b] shrink-0" />
            <span 
              onClick={() => onOpen(task)}
              className="text-[#d4d4d4] font-medium truncate cursor-pointer hover:underline decoration-[#5a5a5a] underline-offset-4 select-none"
            >
              {task.name}
            </span>
            <button 
              onClick={() => onOpen(task)}
              className="ml-2 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[10px] text-[#9b9b9b] border border-[#3f3f3f] rounded bg-[#2c2c2c] cursor-pointer hover:bg-[#373737] hover:text-[#d4d4d4] transition-all"
            >
              OPEN
            </button>
          </div>
        </div>

        {/* Status Column */}
        <div className="w-[120px] border-r border-[#2f2f2f] p-2 flex items-center">
           <span 
            onClick={handleStatusClick}
            className={`px-2 py-0.5 rounded-md text-xs cursor-pointer select-none transition-all ${getStatusStyle(task.status)}`}
          >
              {task.status}
          </span>
        </div>

        {/* Level Column */}
        <div className="w-[180px] border-r border-[#2f2f2f] p-2 flex items-center">
          <span 
            onClick={handleLevelClick}
            className={`px-2 py-0.5 rounded-md text-xs border ${getLevelColor(task.level)} cursor-pointer hover:brightness-110 transition-all select-none`}
          >
              {task.level}
          </span>
        </div>

        {/* Date Column - Clickable */}
        <div 
          className="w-[280px] p-2 flex items-center text-[#9b9b9b] hover:bg-[#333333] cursor-pointer transition-colors relative"
          onClick={handleDateClick}
        >
          {formatDateRange(task.startDate, task.endDate)}
        </div>
        
        {/* Spacer Column */}
        <div className="flex-grow min-w-[50px]"></div>
      </div>

      {/* Date Picker Popover */}
      {showDatePicker && (
        <DateRangePicker 
          startDate={task.startDate}
          endDate={task.endDate}
          onSave={(start, end) => onUpdate(task.id, { startDate: start, endDate: end })}
          onClose={() => setShowDatePicker(false)}
          position={clickPos}
        />
      )}

      {/* Level Selector Popover */}
      {showLevelMenu && (
        <div 
          ref={levelMenuRef}
          style={{ 
            position: 'fixed', 
            left: levelMenuPos.x, 
            top: levelMenuPos.y,
            zIndex: 100
          }}
          className="bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-xl py-1 flex flex-col w-32 animate-in fade-in zoom-in-95 duration-100"
        >
          {(['大任务', '中任务', '小任务'] as TaskLevel[]).map((level) => (
            <button
              key={level}
              onClick={(e) => {
                e.stopPropagation();
                handleLevelSelect(level);
              }}
              className="text-left px-3 py-2 hover:bg-[#2f2f2f] transition-colors flex items-center"
            >
              <span className={`px-2 py-0.5 rounded text-xs border ${getLevelColor(level)}`}>
                {level}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Status Selector Popover */}
      {showStatusMenu && (
        <div 
          ref={statusMenuRef}
          style={{ 
            position: 'fixed', 
            left: statusMenuPos.x, 
            top: statusMenuPos.y,
            zIndex: 100
          }}
          className="bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-xl py-1 flex flex-col w-32 animate-in fade-in zoom-in-95 duration-100"
        >
          {(['未完成', '已完成'] as TaskStatus[]).map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusSelect(status);
              }}
              className="text-left px-3 py-2 hover:bg-[#2f2f2f] transition-colors flex items-center gap-2"
            >
              <div className={`w-2 h-2 rounded-full ${status === '已完成' ? 'bg-white' : 'bg-[#5a5a5a]'}`}></div>
              <span className={`text-sm ${status === '已完成' ? 'text-[#d4d4d4]' : 'text-[#9b9b9b]'}`}>
                {status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Recursive Render Children */}
      {isExpanded && hasSubtasks && task.subtasks!.map(subtask => (
        <TaskRow 
          key={subtask.id} 
          task={subtask} 
          onOpen={onOpen} 
          onUpdate={onUpdate}
          depth={depth + 1} 
        />
      ))}
    </>
  );
};