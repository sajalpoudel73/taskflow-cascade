
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
    const taskList = document.querySelector('TaskList');
    if (taskList) {
      taskList.dispatchEvent(new Event('taskCreated'));
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Task Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask(prev => ({
              ...prev,
              title: e.target.value
            }))}
          />
          <Input
            type="datetime-local"
            value={newTask.dueDate}
            onChange={(e) => setNewTask(prev => ({
              ...prev,
              dueDate: e.target.value
            }))}
          />
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
        
        <Textarea
          placeholder="Task description"
          className="mb-4"
          value={newTask.description}
          onChange={(e) => setNewTask(prev => ({
            ...prev,
            description: e.target.value
          }))}
        />
      </div>

      <TaskList onViewTask={handleViewTask} />
      
      <TaskDialog
        task={selectedTask}
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        onTaskUpdated={() => {
          // Force TaskList to reload
          const taskList = document.querySelector('TaskList');
          if (taskList) {
            taskList.dispatchEvent(new Event('taskCreated'));
          }
        }}
      />
    </div>
  );
};

export default Index;
