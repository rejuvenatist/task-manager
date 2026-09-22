
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Menu, 
  MessageSquare, 
  MoreHorizontal, 
  Star, 
  List, 
  Kanban, 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Search, 
  Type, 
  Layers, 
  Calendar, 
  Check, 
  Loader2,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { TaskRow } from './components/TaskRow';
import { NewTaskModal } from './components/NewTaskModal';
import { TaskSidePanel } from './components/TaskSidePanel';
import { TimelineView } from './components/TimelineView';
import { LoginPage } from './components/LoginPage';
import { Task, NewTaskInput, TaskLevel, TaskStatus } from './types';
import { supabase } from './lib/supabaseClient';

// Helper to find a task recursively
const findTaskRecursive = (tasks: Task[], id: string): Task | undefined => {
  for (const task of tasks) {
    if (task.id === id) return task;
    if (task.subtasks) {
      const found = findTaskRecursive(task.subtasks, id);
      if (found) return found;
    }
  }
  return undefined;
};

// Helper to add a subtask recursively
const addTaskRecursive = (tasks: Task[], parentId: string, newTask: Task): Task[] => {
  return tasks.map(task => {
    if (task.id === parentId) {
      return { 
        ...task, 
        subtasks: [...(task.subtasks || []), newTask] 
      };
    }
    if (task.subtasks) {
      return { 
        ...task, 
        subtasks: addTaskRecursive(task.subtasks, parentId, newTask) 
      };
    }
    return task;
  });
};

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- APP STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [creatingSubtaskForId, setCreatingSubtaskForId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  
  // Filter State
  const [filterLevel, setFilterLevel] = useState<TaskLevel>('大任务'); 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Status Filter / Sort State
  const [filterStatus, setFilterStatus] = useState<TaskStatus | '不限'>('不限');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If we just logged in, trigger data fetch
      if (session) {
        // Reset data loading state to trigger fetch in the next effect
        setIsLoading(true); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SUPABASE DATA FETCH LOGIC ---
  useEffect(() => {
    // Only fetch if authenticated
    if (!session) return;

    const fetchTasks = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*');

        if (error) {
          console.error('Supabase Error:', error);
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }

        if (data) {
          const taskMap: Record<string, Task> = {};
          const roots: Task[] = [];

          data.forEach((row: any) => {
            taskMap[row.id] = {
              id: row.id,
              name: row.name,
              level: row.level as TaskLevel,
              status: (row.status as TaskStatus) || '未完成',
              startDate: row.start_date, 
              endDate: row.end_date,     
              subtasks: []
            };
          });

          data.forEach((row: any) => {
            const task = taskMap[row.id];
            if (row.parent_id && taskMap[row.parent_id]) {
              taskMap[row.parent_id].subtasks?.push(task);
            } else {
              roots.push(task);
            }
          });
          
          // Sort root tasks by ID if they are numeric, to keep order consistent
          roots.sort((a, b) => {
             const idA = parseInt(a.id);
             const idB = parseInt(b.id);
             if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
             return a.id.localeCompare(b.id);
          });

          setTasks(roots);
        }
      } catch (err: any) {
        console.error('Unexpected Error:', err);
        setErrorMsg(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [session]); // Add session as dependency

  // Close filter/sort dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTasks([]); // Clear local data on logout
  };

  const selectedTask = selectedTaskId ? findTaskRecursive(tasks, selectedTaskId) : null;

  // --- STATISTICS LOGIC ---
  const { smallCompleted, smallUncompleted } = useMemo(() => {
    let completed = 0;
    let uncompleted = 0;
    
    const traverse = (list: Task[]) => {
      list.forEach(t => {
        if (t.level === '小任务') {
          if (t.status === '已完成') completed++;
          else uncompleted++; 
        }
        if (t.subtasks) traverse(t.subtasks);
      });
    };
    
    traverse(tasks);
    return { smallCompleted: completed, smallUncompleted: uncompleted };
  }, [tasks]);

  const totalSmall = smallCompleted + smallUncompleted;
  const progressPercent = totalSmall === 0 ? 0 : Math.round((smallCompleted / totalSmall) * 100);

  // --- FILTER LOGIC FOR LIST VIEW ---
  const visibleTasks = useMemo(() => {
    // 1. Default Hierarchy View: Only if both filters are default
    // Note: '大任务' in the dropdown is treated as "Default/Root View" here unless we are filtering by status
    if (filterLevel === '大任务' && filterStatus === '不限') {
       return tasks; // Return roots, TaskRow handles subtasks
    }
    
    // 2. Filtered View: Flatten list and show only matches
    const flattened: Task[] = [];
    
    const traverse = (list: Task[]) => {
       for (const t of list) {
          // Check Level
          // If '大任务' is selected combined with a status, we treat it as strictly Big Tasks
          const matchesLevel = t.level === filterLevel;
          
          // Check Status
          const matchesStatus = filterStatus === '不限' ? true : t.status === filterStatus;
          
          if (matchesLevel && matchesStatus) {
             // Create a shallow copy without subtasks to prevent expansion in filtered flat view
             // This gives a "Database Table" feel when filtering
             const { subtasks, ...rest } = t;
             flattened.push({ ...rest, subtasks: [] });
          }
          
          // Continue traversing even if parent doesn't match
          if (t.subtasks) traverse(t.subtasks);
       }
    };
    
    traverse(tasks);
    return flattened;
  }, [tasks, filterLevel, filterStatus]);


  // --- CREATE TASK (SYNC) ---
  const handleAddTask = async (input: NewTaskInput) => {
    let newTaskId: string;

    if (creatingSubtaskForId) {
      // Logic for Subtasks
      const parentTask = findTaskRecursive(tasks, creatingSubtaskForId);
      
      // Try to maintain hierarchy format "1-1", "1-2" if parent is numeric like "1" or "1-1"
      if (parentTask && /^[\d-]+$/.test(parentTask.id)) {
        const subtasks = parentTask.subtasks || [];
        const prefix = parentTask.id + '-';
        const indices = subtasks
          .filter(t => t.id.startsWith(prefix) && /^\d+$/.test(t.id.slice(prefix.length)))
          .map(t => parseInt(t.id.slice(prefix.length), 10));
        
        const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 1;
        newTaskId = `${parentTask.id}-${nextIndex}`;
      } else {
        // Fallback for UUID parents
        newTaskId = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substr(2, 9);
      }
    } else {
      // Logic for Root Tasks (Big Tasks) - Sequential Integers
      const numericIds = tasks
        .filter(t => /^\d+$/.test(t.id)) // Only purely numeric IDs
        .map(t => parseInt(t.id, 10));
      
      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
      newTaskId = (maxId + 1).toString();
    }
      
    const newTask: Task = {
      id: newTaskId,
      ...input,
      subtasks: []
    };

    // 1. Optimistic UI Update
    if (creatingSubtaskForId) {
      setTasks(prevTasks => addTaskRecursive(prevTasks, creatingSubtaskForId, newTask));
      setCreatingSubtaskForId(null);
    } else {
      setTasks(prev => [...prev, newTask]);
    }

    // 2. Sync to Supabase
    try {
      const { error } = await supabase.from('tasks').insert({
        id: newTaskId, // Using our custom ID
        name: input.name,
        level: input.level,
        status: input.status,
        start_date: input.startDate,
        end_date: input.endDate,
        parent_id: creatingSubtaskForId || null
      });

      if (error) {
        console.error('Error creating task in DB:', error);
      }
    } catch (err) {
      console.error('Error connecting to DB:', err);
    }
  };

  // --- UPDATE TASK (SYNC) ---
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // 1. Optimistic UI Update
    setTasks(prevTasks => {
      const updateRecursive = (list: Task[]): Task[] => {
        return list.map(t => {
          if (t.id === taskId) {
            return { ...t, ...updates };
          }
          if (t.subtasks) {
            return { ...t, subtasks: updateRecursive(t.subtasks) };
          }
          return t;
        });
      };
      return updateRecursive(prevTasks);
    });

    // 2. Sync to Supabase
    try {
      // Map frontend keys to DB snake_case columns
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('tasks')
          .update(dbUpdates)
          .eq('id', taskId);

        if (error) console.error('Error updating task in DB:', error);
      }
    } catch (err) {
      console.error('Error connecting to DB:', err);
    }
  };

  // --- DELETE TASK (SYNC) ---
  const handleDeleteTask = async (taskId: string) => {
    console.log("Attempting to delete task:", taskId);
    
    // 1. Optimistic UI Update
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null); // Close panel if deleting active task
    }

    setTasks(prevTasks => {
       let promotedSubtasks: Task[] = [];

       const deleteRecursive = (list: Task[]): Task[] => {
         return list.reduce((acc, t) => {
            if (t.id === taskId) {
               // Found the task to delete.
               // Keep its subtasks to promote them to root level.
               if (t.subtasks && t.subtasks.length > 0) {
                 promotedSubtasks = [...promotedSubtasks, ...t.subtasks];
               }
               // Do not add the task itself to acc (effectively deleting it)
               return acc;
            } else {
               // Not the task to delete. Process its children recursively.
               const newSubtasks = t.subtasks ? deleteRecursive(t.subtasks) : [];
               
               acc.push({
                 ...t,
                 subtasks: newSubtasks
               });
               return acc;
            }
         }, [] as Task[]);
       };
       
       const newRoots = deleteRecursive(prevTasks);
       // Add the promoted subtasks to the root level
       return [...newRoots, ...promotedSubtasks];
    });

    // 2. Sync to Supabase
    try {
      // Step A: Update subtasks to have no parent (make them orphans/root tasks)
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ parent_id: null })
        .eq('parent_id', taskId);

      if (updateError) {
         console.error('Error unlinking subtasks in DB:', updateError);
      }

      // Step B: Delete the task itself
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
         console.error('Error deleting task in DB:', deleteError);
         // If DB delete fails, in a full production app we might revert the UI state here,
         // but for now we keep the optimistic update to ensure responsiveness.
      } else {
         console.log("Task deleted successfully from DB");
      }
    } catch (err) {
      console.error('Error connecting to DB:', err);
    }
  };

  const openSubtaskModal = () => {
    if (selectedTaskId) {
      setCreatingSubtaskForId(selectedTaskId);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCreatingSubtaskForId(null); 
  };

  // --- RENDER CONDITIONALS ---

  // 1. Check Auth Loading first
  if (isAuthLoading) {
    return (
      <div className="flex w-full h-screen bg-[#191919] items-center justify-center text-[#9b9b9b] flex-col gap-4">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // 2. If no session, show Login Page
  if (!session) {
    return <LoginPage />;
  }

  // 3. If authenticated but loading data
  if (isLoading) {
    return (
      <div className="flex w-full h-screen bg-[#191919] items-center justify-center text-[#9b9b9b] flex-col gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex w-full h-screen bg-[#191919] items-center justify-center text-red-400 flex-col gap-4">
        <p className="text-xl">Error loading tasks</p>
        <p className="text-sm opacity-70">{errorMsg}</p>
        <button 
          onClick={handleLogout} 
          className="mt-4 px-4 py-2 bg-[#2f2f2f] rounded hover:bg-[#3f3f3f] text-[#d4d4d4] transition-colors"
        >
          Logout & Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-[#191919] font-sans selection:bg-[#2383e247] relative">
      
      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${selectedTask ? 'mr-[45%] md:mr-[50%] lg:mr-[45%]' : ''}`}>
        
        {/* Top Header */}
        <header className="h-12 border-b border-[#2f2f2f] flex items-center justify-between px-4 bg-[#191919] text-[#d4d4d4] shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1 hover:bg-[#2f2f2f] rounded">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-sm breadcrumbs">
               <div className="flex items-center gap-1.5">
                 <span role="img" aria-label="emoji">💼</span>
                 <span className="font-medium truncate">全部任务</span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#9b9b9b]">
            <span className="text-xs mr-2 opacity-60 hidden sm:inline flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-green-500"></div> Online
            </span>
            <button className="p-1 hover:bg-[#2f2f2f] hover:text-[#d4d4d4] rounded transition-colors">
               <MessageSquare size={18} />
            </button>
            <button className="p-1 hover:bg-[#2f2f2f] hover:text-[#d4d4d4] rounded transition-colors">
               <Star size={18} />
            </button>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              title="Sign Out"
              className="p-1 hover:bg-[#2f2f2f] hover:text-[#d4d4d4] rounded transition-colors text-red-400/80 hover:text-red-400 ml-2"
            >
               <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 flex flex-col mx-auto w-full pt-8 pb-4 px-8 ${selectedTask ? 'max-w-none px-6' : 'max-w-[1200px] md:px-12 lg:px-24'}`}>
            
            {/* Title Section */}
            <div className="group relative mb-6 shrink-0">
              <h1 className="text-4xl font-bold text-[#d4d4d4] mb-6 flex items-center gap-4">
                 <span className="text-4xl">💼</span> 全部任务
              </h1>

              {/* Statistics Dashboard (Moved to Top) */}
              <div className="mb-8 p-5 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-sm">
                 <h3 className="text-[#9b9b9b] text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#2f2f2f] pb-2">Statistics Overview</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   
                   {/* Col 1: Uncompleted Small Tasks */}
                   <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-[#d4d4d4]">未完成小任务</span>
                        <span className="text-[#d4d4d4] font-mono bg-[#2f2f2f] px-2 rounded text-xs py-0.5">{smallUncompleted}</span>
                      </div>
                      <div className="h-2 w-full bg-[#2f2f2f] rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-orange-500/70"
                           style={{ width: `${totalSmall === 0 ? 0 : (smallUncompleted / totalSmall) * 100}%` }}
                         ></div>
                      </div>
                   </div>

                   {/* Col 2: Completed Small Tasks */}
                   <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-[#d4d4d4]">已完成小任务</span>
                        <span className="text-[#d4d4d4] font-mono bg-[#2f2f2f] px-2 rounded text-xs py-0.5">{smallCompleted}</span>
                      </div>
                      <div className="h-2 w-full bg-[#2f2f2f] rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-green-500/70"
                           style={{ width: `${totalSmall === 0 ? 0 : (smallCompleted / totalSmall) * 100}%` }}
                         ></div>
                      </div>
                   </div>

                   {/* Col 3: Progress */}
                   <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-[#d4d4d4]">进度</span>
                        <span className="text-[#d4d4d4] font-mono font-bold">{progressPercent}%</span>
                      </div>
                      <div className="text-xs text-[#5a5a5a]">
                        Based on {totalSmall} total small tasks
                      </div>
                   </div>
                   
                 </div>
              </div>

              {/* View Switcher */}
              <div className="text-[#9b9b9b] flex items-center gap-4 text-sm border-b border-[#2f2f2f] pb-2 overflow-x-auto">
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`pb-2 border-b-2 font-medium flex items-center gap-2 shrink-0 transition-colors ${viewMode === 'list' ? 'border-[#d4d4d4] text-[#d4d4d4]' : 'border-transparent hover:text-[#d4d4d4]'}`}
                 >
                    <List size={16} /> 列表视图
                 </button>
                 <button 
                   onClick={() => setViewMode('timeline')}
                   className={`pb-2 border-b-2 font-medium flex items-center gap-2 shrink-0 transition-colors ${viewMode === 'timeline' ? 'border-[#d4d4d4] text-[#d4d4d4]' : 'border-transparent hover:text-[#d4d4d4]'}`}
                 >
                    <Kanban size={16} /> 看板
                 </button>
                 <button className="pb-2 border-b-2 border-transparent hover:text-[#d4d4d4] transition-colors flex items-center gap-2 shrink-0">
                    <CalendarIcon size={16} /> Calendar
                 </button>
                 <button className="ml-auto p-1 hover:bg-[#2f2f2f] rounded text-[#9b9b9b]">
                   <Plus size={16} />
                 </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0 relative z-20">
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-[#2383e2] hover:bg-[#1d70c2] text-white text-sm rounded cursor-pointer transition-colors" onClick={() => setIsModalOpen(true)}>
                    <Plus size={14} strokeWidth={3} /> <span className="font-medium">新建</span>
                 </div>
                 <div className="h-6 w-[1px] bg-[#3f3f3f] mx-1"></div>
                 
                 {/* Filter Dropdown */}
                 <div className="relative" ref={filterRef}>
                   <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-1.5 text-[#d4d4d4] hover:bg-[#2f2f2f] px-2 py-1 rounded text-sm transition-colors ${isFilterOpen ? 'bg-[#2f2f2f]' : ''}`}
                   >
                      <Filter size={14} className={filterLevel !== '大任务' ? 'text-blue-400' : 'text-[#9b9b9b]'} /> 
                      <span>Filter</span>
                   </button>
                   {isFilterOpen && (
                     <div className="absolute top-full left-0 mt-1 w-48 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-xl py-1 z-30 flex flex-col">
                       {(['大任务', '中任务', '小任务'] as TaskLevel[]).map(level => (
                         <button
                           key={level}
                           onClick={() => {
                             setFilterLevel(level);
                             setIsFilterOpen(false);
                           }}
                           className="flex items-center justify-between px-3 py-2 text-sm text-[#d4d4d4] hover:bg-[#2f2f2f] w-full text-left"
                         >
                           <span>{level}</span>
                           {filterLevel === level && <Check size={14} className="text-blue-500" />}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
                 
                 {/* Sort / Status Dropdown */}
                 <div className="relative" ref={sortRef}>
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className={`flex items-center gap-1.5 text-[#d4d4d4] hover:bg-[#2f2f2f] px-2 py-1 rounded text-sm transition-colors ${isSortOpen ? 'bg-[#2f2f2f]' : ''}`}
                    >
                        <ArrowUpDown size={14} className={filterStatus !== '不限' ? 'text-blue-400' : 'text-[#9b9b9b]'} /> 
                        <span>Sort</span>
                    </button>
                    {isSortOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-xl py-1 z-30 flex flex-col">
                            {(['不限', '未完成', '已完成'] as (TaskStatus | '不限')[]).map(status => (
                                <button
                                key={status}
                                onClick={() => {
                                    setFilterStatus(status);
                                    setIsSortOpen(false);
                                }}
                                className="flex items-center justify-between px-3 py-2 text-sm text-[#d4d4d4] hover:bg-[#2f2f2f] w-full text-left"
                                >
                                <span>{status}</span>
                                {filterStatus === status && <Check size={14} className="text-blue-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
              </div>
              <div className="flex items-center gap-2 text-[#9b9b9b] border border-[#3f3f3f] rounded px-2 py-1 hover:border-[#5a5a5a] transition-colors w-48">
                 <Search size={14} />
                 <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm text-[#d4d4d4] w-full placeholder-[#5a5a5a]" />
              </div>
            </div>

            {/* View Content - No fixed height constraints to allow page scroll */}
            <div className="flex-1 border-t border-[#2f2f2f] flex flex-col">
               
               {viewMode === 'list' ? (
                 <div className="flex flex-col">
                   {/* Table Header */}
                   <div className="flex items-center text-xs text-[#9b9b9b] border-b border-[#2f2f2f] bg-[#191919] sticky top-0 z-10">
                      <div className="flex-1 min-w-[300px] px-3 py-2 flex items-center gap-2 border-r border-[#2f2f2f] hover:bg-[#252525] cursor-pointer">
                         <Type size={12} /> 名称
                      </div>
                      <div className="w-[120px] px-3 py-2 flex items-center gap-2 border-r border-[#2f2f2f] hover:bg-[#252525] cursor-pointer">
                         <CheckCircle2 size={12} /> 状态
                      </div>
                      <div className="w-[180px] px-3 py-2 flex items-center gap-2 border-r border-[#2f2f2f] hover:bg-[#252525] cursor-pointer">
                         <Layers size={12} /> 层级
                      </div>
                      <div className="w-[280px] px-3 py-2 flex items-center gap-2 hover:bg-[#252525] cursor-pointer">
                         <Calendar size={12} /> 日期
                      </div>
                      <div className="flex-grow min-w-[50px]"></div>
                   </div>

                   {/* Table Body */}
                   <div className="pb-12 min-h-[200px]">
                      {visibleTasks.length === 0 && !isLoading && (
                        <div className="flex items-center justify-center py-10 text-[#5a5a5a]">
                           No tasks found matching current filters.
                        </div>
                      )}
                      {visibleTasks.map(task => (
                        <TaskRow 
                          key={task.id} 
                          task={task} 
                          onOpen={(t) => setSelectedTaskId(t.id)}
                          onUpdate={handleUpdateTask}
                        />
                      ))}
                      
                      {/* "New" Row placeholder - Only show if in default view */}
                      {filterLevel === '大任务' && filterStatus === '不限' && (
                        <div 
                            className="flex items-center py-2 px-3 text-[#9b9b9b] hover:bg-[#252525] cursor-pointer border-b border-[#2f2f2f] transition-colors"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={16} className="mr-3" /> 
                            <span className="text-sm">New</span>
                        </div>
                      )}
                   </div>

                   <div className="flex justify-end mt-4 text-xs text-[#5a5a5a] px-3 pb-4">
                      Visible Tasks: {visibleTasks.length}
                   </div>
                 </div>
               ) : (
                 <TimelineView 
                    tasks={tasks}
                    onOpenTask={(t) => setSelectedTaskId(t.id)}
                    filterLevel={filterLevel}
                    filterStatus={filterStatus}
                 />
               )}
            </div>

          </div>
        </div>
      </main>

      {/* Side Panel (Absolute Right Peek) */}
      {selectedTask && (
        <div className="absolute top-0 right-0 w-[45%] md:w-[50%] lg:w-[45%] h-full shadow-2xl z-50 bg-[#191919] border-l border-[#2f2f2f]">
          <TaskSidePanel 
            task={selectedTask} 
            onClose={() => setSelectedTaskId(null)}
            onAddSubtask={openSubtaskModal}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        </div>
      )}

      <NewTaskModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSubmit={handleAddTask} 
      />
    </div>
  );
};

export default App;
