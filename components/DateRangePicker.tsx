import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onSave: (start: string, end: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate: initialStart,
  endDate: initialEnd,
  onSave,
  onClose,
  position
}) => {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Default to center if no position provided, otherwise follow mouse/element
  const style: React.CSSProperties = position 
    ? { 
        position: 'fixed', 
        left: Math.min(position.x, window.innerWidth - 300), // Prevent overflow right
        top: Math.min(position.y + 10, window.innerHeight - 200) // Prevent overflow bottom
      } 
    : { 
        position: 'fixed', 
        left: '50%', 
        top: '50%', 
        transform: 'translate(-50%, -50%)' 
      };

  return (
    <div 
      ref={ref}
      style={style}
      className="z-50 bg-[#252525] border border-[#3f3f3f] rounded-lg shadow-xl p-4 w-[280px] animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-4"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-[#9b9b9b] flex items-center gap-1.5 font-medium">
             <Calendar size={12} /> Start Date (开始日期)
          </label>
          <input 
            type="date" 
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full bg-[#191919] border border-[#3f3f3f] text-[#d4d4d4] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#9b9b9b] flex items-center gap-1.5 font-medium">
             <Calendar size={12} /> End Date (结束日期)
          </label>
          <input 
            type="date" 
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full bg-[#191919] border border-[#3f3f3f] text-[#d4d4d4] rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
          />
        </div>
      </div>
      
      <div className="flex justify-end border-t border-[#3f3f3f] pt-3">
        <button 
          onClick={() => { onSave(start, end); onClose(); }}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded transition-colors font-medium shadow-lg shadow-blue-900/20"
        >
          Update Date
        </button>
      </div>
    </div>
  );
};
