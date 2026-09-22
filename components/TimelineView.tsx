
import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Task, TaskLevel, TaskStatus } from '../types';
import { getDaysArray, diffInDays, parseAsLocalDate } from '../utils/dateUtils';

interface TimelineViewProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  filterLevel: TaskLevel;
  filterStatus: TaskStatus | '不限';
}

const CELL_WIDTH = 48; // Width of one day column

export const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onOpenTask, filterLevel, filterStatus }) => {
  // Initialize to the 1st of the current month
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Set to 1st
    d.setHours(0, 0, 0, 0); // Normalize time
    return d;
  });

  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Calculate month boundaries
  const monthStart = useMemo(() => {
    const d = new Date(currentMonthDate);
    d.setDate(1);
    return d;
  }, [currentMonthDate]);

  const monthEnd = useMemo(() => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // Last day of previous month (which is the current month in view)
    return d;
  }, [currentMonthDate]);

  // Generate strictly the days for this month
  const days = useMemo(() => {
    const daysInMonth = monthEnd.getDate();
    return getDaysArray(monthStart, daysInMonth);
  }, [monthStart, monthEnd]);

  // Helper for Month Navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonthDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonthDate(newDate);
  };

  // Helper to handle "Today" click - jumps to current real-time month
  const handleTodayClick = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCurrentMonthDate(d);
  };

  const toggleTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setExpandedTaskIds(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
    });
  };

  // Logic to determine visible rows based on filter and expansion
  const visibleRows = useMemo(() => {
    const rows: { task: Task, depth: number }[] = [];

    // Filter Helper: Only include tasks that start on or before the end of the month
    // If a task starts after this month, we don't show it.
    const isDateInRange = (t: Task) => {
        const tStart = parseAsLocalDate(t.startDate);
        return tStart <= monthEnd; 
    };

    const matchesStatus = (t: Task) => {
        if (filterStatus === '不限') return true;
        return t.status === filterStatus;
    };

    const shouldShowTask = (t: Task) => isDateInRange(t) && matchesStatus(t);

    // Recursive collectors
    const collectTasksByLevel = (list: Task[], level: TaskLevel, result: { task: Task, depth: number }[]) => {
        for (const t of list) {
            // Strictly check matchesStatus AND matchesLevel
            if (shouldShowTask(t)) {
                if (t.level === level) {
                    result.push({ task: t, depth: 0 });
                }
            }
            if (t.subtasks && t.subtasks.length > 0) {
                collectTasksByLevel(t.subtasks, level, result);
            }
        }
    };

    const processHierarchy = (list: Task[], depth: number) => {
        for (const t of list) {
            if (shouldShowTask(t)) {
                rows.push({ task: t, depth });
                // If it has subtasks and is expanded, process children
                if (t.subtasks && t.subtasks.length > 0 && expandedTaskIds.has(t.id)) {
                    processHierarchy(t.subtasks, depth + 1);
                }
            }
        }
    };

    if (filterLevel === '中任务') {
        collectTasksByLevel(tasks, '中任务', rows);
    } else if (filterLevel === '小任务') {
        collectTasksByLevel(tasks, '小任务', rows);
    } else {
        // '大任务' or Default
        if (filterStatus !== '不限') {
            // Strict filtering mode for Big Tasks + Status (Intersection)
            collectTasksByLevel(tasks, '大任务', rows);
        } else {
            // Default Hierarchy mode (Tree View) if no strict status filter
            processHierarchy(tasks, 0);
        }
    }
    
    return rows;
  }, [tasks, filterLevel, filterStatus, expandedTaskIds, monthEnd]);

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#d4d4d4]">
      
      {/* Timeline Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[#2f2f2f] rounded p-0.5">
             <button 
               onClick={() => handleMonthChange('prev')}
               className="p-1 hover:bg-[#3f3f3f] rounded text-[#9b9b9b] transition-colors"
             >
               <ChevronLeft size={16} />
             </button>
             <button 
               onClick={() => handleMonthChange('next')}
               className="p-1 hover:bg-[#3f3f3f] rounded text-[#9b9b9b] transition-colors"
             >
               <ChevronRight size={16} />
             </button>
          </div>
          <button 
            onClick={handleTodayClick}
            className="text-sm font-medium hover:bg-[#2f2f2f] px-2 py-1 rounded transition-colors"
          >
            Today
          </button>
          <div className="text-sm font-bold ml-2">
            {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <button className="flex items-center gap-2 text-xs bg-[#2f2f2f] hover:bg-[#3f3f3f] px-2 py-1.5 rounded transition-colors text-[#d4d4d4]">
           <CalendarIcon size={14} />
           Manage in Calendar
        </button>
      </div>

      {/* Timeline Grid - No internal scroll, allow page scroll */}
      <div className="relative overflow-x-auto custom-scrollbar">
        <div style={{ minWidth: days.length * CELL_WIDTH, width: 'max-content' }}>
          
          {/* Header Row (Days) */}
          <div className="flex border-b border-[#2f2f2f] sticky top-0 bg-[#191919] z-10 h-10">
            {days.map((day, i) => (
              <div 
                key={i} 
                className={`flex-shrink-0 border-r border-[#2f2f2f] flex flex-col items-center justify-center text-xs ${isToday(day) ? 'bg-[#3f2c22]/30' : ''}`}
                style={{ width: CELL_WIDTH }}
              >
                <span className={`${isToday(day) ? 'text-red-400 font-bold' : 'text-[#9b9b9b]'}`}>
                  {day.getDate()}
                </span>
                {isToday(day) && (
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-0.5"></div>
                )}
              </div>
            ))}
          </div>

          {/* Task Rows */}
          <div className="relative pb-10">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none h-full">
               {days.map((day, i) => (
                 <div 
                   key={i} 
                   className={`flex-shrink-0 border-r border-[#2f2f2f] h-full ${isToday(day) ? 'bg-[#3f2c22]/10 border-red-500/20' : ''}`}
                   style={{ width: CELL_WIDTH }}
                 >
                   {isToday(day) && <div className="absolute top-0 w-[1px] h-full bg-red-500/50 left-1/2 -translate-x-1/2"></div>}
                 </div>
               ))}
            </div>

            {/* Task Bars */}
            <div className="relative pt-2">
              {visibleRows.map((item, index) => {
                // Parse using local date helper to fix offset bugs
                const taskStart = parseAsLocalDate(item.task.startDate);
                const taskEnd = parseAsLocalDate(item.task.endDate);
                const hasSubtasks = item.task.subtasks && item.task.subtasks.length > 0;
                const isExpanded = expandedTaskIds.has(item.task.id);
                
                // Clamp dates to the current month view
                // Visual Start: max(taskStart, monthStart)
                const renderStart = taskStart < monthStart ? monthStart : taskStart;
                
                // Visual End: min(taskEnd, monthEnd)
                const renderEnd = taskEnd > monthEnd ? monthEnd : taskEnd;

                // If effective start is after effective end, don't render (task is outside range, though filtering should catch this)
                if (renderStart > renderEnd) return null;

                const diffStart = diffInDays(renderStart, monthStart);
                const duration = diffInDays(renderEnd, renderStart) + 1;
                
                const left = diffStart * CELL_WIDTH;
                const width = Math.max(duration * CELL_WIDTH, 4); // Min width for visibility

                return (
                  <div 
                    key={item.task.id} 
                    className="h-10 relative group mb-1"
                  >
                    {/* The Bar */}
                    <div 
                      className={`absolute top-1 h-8 rounded-md border text-xs flex items-center pl-1 pr-2 cursor-pointer transition-colors overflow-hidden whitespace-nowrap
                        ${item.task.level === '大任务' ? 'bg-[#373737] border-[#505050] text-[#e5e5e5]' : 'bg-[#2c2c2c] border-[#3f3f3f] text-[#d4d4d4]'}
                        hover:bg-[#404040]
                      `}
                      style={{ 
                        left: `${left}px`, 
                        width: `${width}px`,
                      }}
                      onClick={() => onOpenTask(item.task)}
                    >
                      {/* Only show expander if NOT in strict filter mode. 
                          If filterLevel is '大任务' (default) AND filterStatus is '不限', we are in hierarchy mode. 
                          Otherwise we are in flattened filtered mode.
                       */}
                      {filterLevel === '大任务' && filterStatus === '不限' && hasSubtasks && (
                          <div 
                            className="mr-1 p-0.5 hover:bg-[#505050] rounded cursor-pointer z-10"
                            onClick={(e) => toggleTask(e, item.task.id)}
                          >
                             {isExpanded ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                          </div>
                      )}
                      
                      <span className="truncate">{item.task.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
