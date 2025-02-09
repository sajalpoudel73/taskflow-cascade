
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed';
export type TaskType = 'task' | 'sub-task';

export interface Task {
  id: number;
  title: string;
  description: string;
  dueDate?: Date;
  status: TaskStatus;
  type: TaskType;
  parentId?: number;
  createdAt: Date;
}

class TaskDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'taskflow_db';
  private readonly STORE_NAME = 'tasks';
  private readonly VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('parentId', 'parentId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async addTask(task: Omit<Task, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORE_NAME], 'readwrite');
      if (!transaction) {
        reject(new Error('Database not initialized'));
        return;
      }

      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(task);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORE_NAME], 'readonly');
      if (!transaction) {
        reject(new Error('Database not initialized'));
        return;
      }

      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORE_NAME], 'readwrite');
      if (!transaction) {
        reject(new Error('Database not initialized'));
        return;
      }

      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(task);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteTask(id: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const transaction = this.db?.transaction([this.STORE_NAME], 'readwrite');
      if (!transaction) {
        reject(new Error('Database not initialized'));
        return;
      }

      const store = transaction.objectStore(this.STORE_NAME);
      
      // First, get all subtasks
      const subtasks = await this.getSubtasks(id);
      
      // Delete all subtasks
      for (const subtask of subtasks) {
        await store.delete(subtask.id);
      }
      
      // Delete the main task
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getSubtasks(parentId: number): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.STORE_NAME], 'readonly');
      if (!transaction) {
        reject(new Error('Database not initialized'));
        return;
      }

      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('parentId');
      const request = index.getAll(parentId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async searchTasks(query: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  async exportTasks(): Promise<string> {
    const tasks = await this.getAllTasks();
    const csvRows = [
      ['id', 'title', 'description', 'dueDate', 'status', 'type', 'parentId', 'createdAt']
    ];

    tasks.forEach(task => {
      csvRows.push([
        task.id.toString(),
        task.title,
        task.description,
        task.dueDate ? new Date(task.dueDate).toISOString() : '',
        task.status,
        task.type,
        task.parentId?.toString() || '',
        new Date(task.createdAt).toISOString()
      ]);
    });

    return csvRows.map(row => row.join(',')).join('\n');
  }

  async importTasks(csvContent: string): Promise<void> {
    const rows = csvContent.split('\n');
    const headers = rows[0].split(',');
    
    const tasks: Omit<Task, 'id'>[] = rows.slice(1).map(row => {
      const values = row.split(',');
      return {
        title: values[1],
        description: values[2],
        dueDate: values[3] ? new Date(values[3]) : undefined,
        status: values[4] as TaskStatus,
        type: values[5] as TaskType,
        parentId: values[6] ? parseInt(values[6]) : undefined,
        createdAt: new Date(values[7])
      };
    });

    const transaction = this.db?.transaction([this.STORE_NAME], 'readwrite');
    if (!transaction) {
      throw new Error('Database not initialized');
    }

    const store = transaction.objectStore(this.STORE_NAME);
    await Promise.all(tasks.map(task => this.addTask(task)));
  }
}

export const taskDb = new TaskDB();

