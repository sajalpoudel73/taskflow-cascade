
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Upload } from 'lucide-react';

interface TaskActionsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({
  searchQuery,
  setSearchQuery,
  onExport,
  onImport
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[300px] pl-9"
        />
      </div>
      <Button variant="outline" onClick={onExport}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" asChild>
        <label>
          <Upload className="w-4 h-4 mr-2" />
          Import
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onImport}
          />
        </label>
      </Button>
    </div>
  );
};

export default TaskActions;
