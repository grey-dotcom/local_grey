'use client';

import { cn } from '@/lib/utils';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  taskNumber: number;
  isActive: boolean;
  onClick: () => void;
}

export function TaskCard({
  task,
  taskNumber,
  isActive,
  onClick,
}: TaskCardProps) {
  const status = isActive ? 'in-progress' : task.status;

  const renderLeftIcon = () => {
    if (status === 'completed') {
      return (
        <div className="flex-shrink-0 flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px] font-bold">
            check
          </span>
        </div>
      );
    }
    return (
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-center size-8 rounded-full font-bold text-sm transition-colors',
          status === 'in-progress'
            ? 'bg-primary text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
        )}
      >
        {taskNumber}
      </div>
    );
  };

  const statusBadge = () => {
    let text;
    let baseClasses = 'px-2 py-0.5 rounded-full text-[10px] font-bold';
    let statusClasses = '';
    
    switch (status) {
      case 'completed':
        text = '완료';
        statusClasses = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
        break;
      case 'in-progress':
        text = '진행중';
        statusClasses = 'bg-primary text-white';
        break;
      default:
        text = '대기';
        statusClasses = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }

    return (
      <span className={cn(baseClasses, statusClasses)}>
        {text}
      </span>
    );
  };
  
  const titleStyles = cn(
    'text-base truncate',
    {
      'font-medium text-slate-900 dark:text-slate-300': status === 'completed',
      'font-bold text-primary dark:text-blue-400': status === 'in-progress',
      'font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white': status === 'pending',
    }
  );

  const containerStyles = cn(
    'w-full text-left p-4 rounded-[32px] flex items-center gap-3 group transition-colors',
    {
      'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800': status === 'completed' || status === 'pending',
      'bg-blue-50 dark:bg-primary/20 border border-primary dark:border-primary/70 shadow-sm': status === 'in-progress',
      'hover:bg-slate-50 dark:hover:bg-slate-800': status === 'pending',
    }
  );

  return (
    <button
      onClick={onClick}
      className={containerStyles}
    >
      {renderLeftIcon()}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={titleStyles}>{task.title}</span>
          {statusBadge()}
        </div>
        <div>
          <span className={cn("flex-shrink-0 text-xs font-medium", task.requirement === 'required' ? "text-primary" : "text-slate-500 dark:text-slate-400")}>
            {task.requirement === 'required' ? '필수' : '선택'}
          </span>
        </div>
      </div>
      <div className={cn(
          "flex-shrink-0 flex items-center justify-center size-8 rounded-full transition-colors",
          status === 'in-progress' 
            ? 'bg-white dark:bg-slate-800 text-primary hover:bg-slate-50 shadow-sm' 
            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-slate-600'
        )}
      >
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </div>
    </button>
  );
}
