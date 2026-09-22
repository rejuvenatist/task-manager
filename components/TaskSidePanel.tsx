import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Maximize2, 
  Calendar, 
  CornerUpLeft, 
  GitMerge, 
  Layers, 
  Plus, 
  MessageSquare,
  FileText,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { Task } from '../types';
import { formatDateRange } from '../utils/dateUtils';
import { DateRangePicker } from './DateRangePicker';

interface TaskSidePanelProps {
  task: Task;
  onClose: () => void;
  onAddSubtask: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskSidePanel: React.FC<TaskSidePanelProps> = ({ task, onClose, onAddSubtask, onUpdate, onDelete }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.name);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset local title state when the task changes
  useEffect(() => {
    setEditedTitle(task.name);
    setIsEditingTitle(false);
  }, [task.id, task.name]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickPos({ x: e.clientX, y: e.clientY });
    setShowDatePicker(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent handlers from firing
    e.preventDefault();
    
    // Use window.confirm explicitly
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      onDelete(task.id);
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.name) {
      onUpdate(task.id, { name: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="h-full bg-[#191919] border-l border-[#2f2f2f] flex flex-col text-[#d4d4d4] animate-in slide-in-from-right duration-300 w-full shadow-2xl relative">
      
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-[#2f2f2f]">
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-[#2f2f2f] rounded text-[#9b9b9b] transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleDelete}
            className="p-1 hover:bg-[#2f2f2f] rounded text-[#9b9b9b] hover:text-red-400 transition-colors mr-2 flex items-center justify-center"
            title="Delete Task"
            type="button"
          >
            <Trash2 size={16} />
          </button>
          <button className="p-1 hover:bg-[#2f2f2f] rounded text-[#9b9b9b] transition-colors">
            <MoreHorizontal size={16} />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-[#2f2f2f] rounded text-[#9b9b9b] transition-colors">
            <span className="text-xs font-medium px-1">Close</span>
            <X size={16} className="inline" />
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:px-12">
        
        {/* Title */}
        <div className="mb-8 group min-h-[48px] flex items-center">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full bg-transparent text-4xl font-bold text-[#d4d4d4] border-none outline-none placeholder-[#5a5a5a] break-words"
              placeholder="Task name"
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)}
              className="text-4xl font-bold break-words cursor-text border border-transparent hover:border-[#3f3f3f] rounded px-1 -ml-1 py-1 transition-colors w-full"
            >
              {task.name}
            </h1>
          )}
        </div>

        {/* Properties Grid */}
        <div className="space-y-1 mb-8">
          
          {/* Date Property */}
          <div className="flex items-start py-1.5">
            <div className="w-32 flex items-center gap-2 text-[#9b9b9b] text-sm shrink-0">
              <Calendar size={16} />
              <span>日期</span>
            </div>
            <div 
              className="flex-1 text-sm text-[#d4d4d4] hover:bg-[#2f2f2f] rounded px-2 py-0.5 -ml-2 transition-colors cursor-pointer select-none"
              onClick={handleDateClick}
            >
              {formatDateRange(task.startDate, task.endDate)}
            </div>
          </div>

          {/* Parent Item */}
          <div className="flex items-center py-1.5">
            <div className="w-32 flex items-center gap-2 text-[#9b9b9b] text-sm shrink-0">
              <CornerUpLeft size={16} />
              <span>Parent item</span>
            </div>
            <div className="flex-1 text-sm text-[#5a5a5a] px-2 -ml-2">
              Empty
            </div>
          </div>

          {/* Sub-items (Subtasks) */}
          <div className="flex items-start py-1.5">
            <div className="w-32 flex items-center gap-2 text-[#9b9b9b] text-sm shrink-0 pt-1">
              <GitMerge size={16} />
              <span>Sub-item</span>
            </div>
            <div className="flex-1 -ml-2">
              <div className="flex flex-col gap-1">
                {task.subtasks && task.subtasks.length > 0 ? (
                  task.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 text-sm text-[#d4d4d4] bg-[#2f2f2f]/50 hover:bg-[#2f2f2f] px-2 py-1 rounded cursor-pointer border border-[#3f3f3f]">
                      <FileText size={14} className="text-[#9b9b9b]" />
                      <span className="truncate">{sub.name}</span>
                    </div>
                  ))
                ) : null}
                
                <button 
                  onClick={onAddSubtask}
                  className="flex items-center gap-2 text-sm text-[#9b9b9b] hover:text-[#d4d4d4] hover:bg-[#2f2f2f] px-2 py-1 rounded transition-colors w-fit"
                >
                   <Plus size={14} /> 新建子任务
                </button>
              </div>
            </div>
          </div>

          {/* Level Property */}
          <div className="flex items-center py-1.5">
            <div className="w-32 flex items-center gap-2 text-[#9b9b9b] text-sm shrink-0">
              <Layers size={16} />
              <span>层级</span>
            </div>
            <div className="flex-1 px-2 -ml-2">
              <span className="bg-[#3f2c22] text-[#e8b69b] px-2 py-0.5 rounded text-xs border border-[#583b2f]">
                {task.level}
              </span>
            </div>
          </div>

          {/* Add Property Button */}
          <div className="flex items-center py-1.5 mt-2">
             <button className="flex items-center gap-2 text-[#6e6e6e] hover:text-[#9b9b9b] text-sm transition-colors">
               <Plus size={16} /> Add a property
             </button>
          </div>

        </div>

        {/* Separator */}
        <div className="h-[1px] bg-[#2f2f2f] w-full mb-8"></div>

        {/* Comments Section */}
        <div className="space-y-4">
           <h3 className="text-lg font-medium">Comments</h3>
           <div className="flex gap-3">
             <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold shrink-0 mt-1">
               W
             </div>
             <div className="flex-1">
               <div className="bg-[#262626] border border-[#2f2f2f] rounded p-2 text-sm text-[#9b9b9b] hover:bg-[#2f2f2f] cursor-text transition-colors flex items-center gap-2">
                 <span className="opacity-50">Add a comment...</span>
               </div>
             </div>
           </div>
        </div>

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
    </div>
  );
};