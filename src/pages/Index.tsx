
import { useState } from 'react';
import TaskList from '@/components/TaskList';
import TaskDialog from '@/components/TaskDialog';
import { Task, taskDb } from '@/lib/db';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from 'lucide-react';

const Index = () => {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
  });

  const handleCreateTask = async () => {
    if (!newTask.title) return;

    await taskDb.addTask({
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      status: 'Todo',
      type: 'task',
      createdAt: new Date(),
    });

    setNewTask({ title: '', description: '', dueDate: '' });
    // Force TaskList to reload
    const event = new CustomEvent('taskCreated');
    window.dispatchEvent(event);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Task Management</h1>
      <div className="grid grid-cols-[300px,1fr] gap-8">
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
              />
              <Textarea
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
              />
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({
                  ...prev,
                  dueDate: e.target.value
                }))}
              />
              <Button onClick={handleCreateTask} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-lg bg-white shadow-sm p-4">
          <TaskList onViewTask={handleViewTask} />
        </div>
      </div>
      
      <TaskDialog
        task={selectedTask}
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        onTaskUpdated={() => {
          const event = new CustomEvent('taskCreated');
          window.dispatchEvent(event);
        }}
      />
    </div>
  );
};

export default Index;
