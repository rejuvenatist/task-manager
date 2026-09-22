export type TaskLevel = '大任务' | '中任务' | '小任务';
export type TaskStatus = '已完成' | '未完成';

export interface Task {
  id: string;
  name: string;
  level: TaskLevel;
  status: TaskStatus;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  subtasks?: Task[];
}

export interface NewTaskInput {
  name: string;
  level: TaskLevel;
  status: TaskStatus;
  startDate: string;
  endDate: string;
}