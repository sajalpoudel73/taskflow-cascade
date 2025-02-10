
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Task, taskDb } from '@/lib/db';
import { format } from 'date-fns';
import { Plus, Eye, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

interface TaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}) => {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtask, setNewSubtask] = React.useState({
    title: '',
    description: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      loadSubtasks();
    }
  }, [task]);

  const loadSubtasks = async () => {
    if (!task) return;
    const loadedSubtasks = await taskDb.getSubtasks(task.id);
    setSubtasks(loadedSubtasks);
  };

  const handleAddSubtask = async () => {
    if (!task || !newSubtask.title) return;

    await taskDb.addTask({
      title: newSubtask.title,
      description: newSubtask.description,
      status: 'Todo',
      type: 'sub-task',
      parentId: task.id,
      createdAt: new Date(),
    });

    setNewSubtask({ title: '', description: '' });
    setShowSubtaskForm(false);
    loadSubtasks();
    onTaskUpdated();
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await taskDb.deleteTask(subtaskId);
      toast({
        title: "Subtask deleted",
        description: "The subtask has been successfully deleted.",
      });
      loadSubtasks();
      onTaskUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive",
      });
    }
  };

  const handleViewTask = (taskId: number) => {
    navigate(`/task/${taskId}`);
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Created on {format(new Date(task.createdAt), 'PPP')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
          
          {task.dueDate && (
            <div className="space-y-2">
              <h3 className="font-medium">Due Date</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(task.dueDate), 'PPP')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-medium">Subtasks</h3>
            {subtasks.length > 0 ? (
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{subtask.title}</h4>
                      <p className="text-sm text-gray-600">{subtask.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewTask(subtask.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No subtasks yet</p>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowSubtaskForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subtask
            </Button>
          </div>

          {showSubtaskForm && (
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Subtask title"
                value={newSubtask.title}
                onChange={(e) => setNewSubtask(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
              />
              <Textarea
                placeholder="Subtask description"
                value={newSubtask.description}
                onChange={(e) => setNewSubtask(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddSubtask}>Save Subtask</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSubtaskForm(false);
                    setNewSubtask({ title: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
