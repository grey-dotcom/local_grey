import TaskCapturePage from '@/components/task-capture-page';

export default function Home() {
  return (
    <main className="flex h-svh w-full flex-col bg-white dark:bg-slate-900 overflow-hidden">
      <TaskCapturePage />
    </main>
  );
}
