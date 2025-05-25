export interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

export interface TodoListResponse {
  todos: Todo[];
  total: number;
  skip: number;
  limit: number;
}

export interface AddTodoPayload {
  todo: string;
  completed: boolean;
  userId: number;
}

export interface UpdateTodoPayload {
  todo?: string;
  completed?: boolean;
}

export interface DeleteTodoResponse extends Todo {
  isDeleted: boolean;
  deletedOn: string;
}
