
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, taskDb } from '@/lib/db';
import TaskFilters from './TaskFilters';
import TaskActions from './TaskActions';
import TaskRow from './TaskRow';
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaskListProps {
  onViewTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ onViewTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    taskDb.init().then(() => {
      loadTasks();
    });

    const handleTaskCreated = () => {
      loadTasks();
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    };

    window.addEventListener('taskCreated', handleTaskCreated);
    return () => window.removeEventListener('taskCreated', handleTaskCreated);
  }, []);

  const loadTasks = async () => {
    const allTasks = await taskDb.getAllTasks();
    setTasks(allTasks);
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, status: newStatus };
      await taskDb.updateTask(updatedTask);
      await loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await taskDb.deleteTask(taskId);
      await loadTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    }
  };

  const handleExport = async () => {
    const csv = await taskDb.exportTasks();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          await taskDb.importTasks(text);
          await loadTasks();
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleTaskExpand = (taskId: number) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const filteredTasks = tasks
    .filter(task => task.type === 'task')
    .filter(task => {
      const matchesFilter = filter === 'completed' 
        ? task.status === 'Completed'
        : task.status !== 'Completed';
      
      const matchesStatusFilter = statusFilter === 'all' || task.status === statusFilter;
      
      if (searchQuery) {
        return matchesFilter && matchesStatusFilter && (
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return matchesFilter && matchesStatusFilter;
    })
    .sort((a, b) => {
      const statusPriority = {
        'In Progress': 0,
        'Review': 1,
        'Todo': 2,
        'Completed': 3,
      };
      
      const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                        statusPriority[b.status as keyof typeof statusPriority];
      
      if (statusDiff !== 0) return statusDiff;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <TaskFilters
          filter={filter}
          setFilter={setFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <TaskActions
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onExport={handleExport}
          onImport={handleImport}
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onViewTask={onViewTask}
              onDeleteTask={handleDeleteTask}
              subtasks={tasks.filter(t => t.parentId === task.id)}
              isExpanded={expandedTasks.includes(task.id)}
              onToggleExpand={() => toggleTaskExpand(task.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskList;
