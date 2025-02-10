
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task, taskDb } from '@/lib/db';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return;
      const tasks = await taskDb.getAllTasks();
      const foundTask = tasks.find(t => t.id === Number(taskId));
      if (foundTask) {
        setTask(foundTask);
        const loadedSubtasks = await taskDb.getSubtasks(foundTask.id);
        setSubtasks(loadedSubtasks);
      }
    };

    loadTask();
  }, [taskId]);

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Task not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tasks
      </Button>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="text-sm text-gray-500">
            Created on {format(new Date(task.createdAt), 'PPP')}
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-gray-600">{task.description}</p>
        </div>

        {task.dueDate && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Due Date</h2>
            <p className="text-gray-600">
              {format(new Date(task.dueDate), 'PPP')}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            {task.status}
          </div>
        </div>

        {subtasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Subtasks</h2>
            <div className="space-y-3">
              {subtasks.map(subtask => (
                <div key={subtask.id} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">{subtask.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Status: {subtask.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
