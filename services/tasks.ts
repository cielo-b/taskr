import api from "./api";

export const TodoService = {
  async getAllTodos(limit = 30, skip = 0) {
    try {
      console.log('TodoService: Making API call to /todos with params:', { limit, skip });
      const response = await api.get("/todos", {
        params: { limit, skip },
      });
      console.log('TodoService: API response received:', response);
      console.log('TodoService: Response data:', response.data);
      return response;
    } catch (error: any) {
      console.error("TodoService: Error fetching todos:", error);
      if (error.response) {
        console.error("TodoService: Error response:", error.response.data);
        console.error("TodoService: Error status:", error.response.status);
      } else if (error.request) {
        console.error("TodoService: No response received:", error.request);
      } else {
        console.error("TodoService: Error message:", error.message);
      }
      throw error;
    }
  },

  async getTodoById(id: number) {
    try {
      console.log('TodoService: Getting todo by ID:', id);
      const response = await api.get(`/todos/${id}`);
      console.log('TodoService: Todo by ID response:', response.data);
      return response;
    } catch (error) {
      console.error("Error fetching todo:", error);
      throw error;
    }
  },

  // Get random todo
  async getRandomTodo(count = 1) {
    try {
      console.log('TodoService: Getting random todo, count:', count);
      const response = await api.get(`/todos/random${count > 1 ? `/${count}` : ""}`);
      console.log('TodoService: Random todo response:', response.data);
      return response;
    } catch (error) {
      console.error("Error fetching random todo:", error);
      throw error;
    }
  },

  // Get todos by user ID
  async getTodosByUserId(userId: number) {
    try {
      console.log('TodoService: Getting todos by user ID:', userId);
      const response = await api.get(`/todos/user/${userId}`);
      console.log('TodoService: Todos by user ID response:', response.data);
      return response;
    } catch (error) {
      console.error("Error fetching user todos:", error);
      throw error;
    }
  },

  async addTodo(todo: string, completed: boolean, userId: number) {
    try {
      console.log('TodoService: Adding todo:', { todo, completed, userId });
      const response = await api.post("/todos/add", {
        todo,
        completed,
        userId,
      });
      console.log('TodoService: Add todo response:', response.data);
      return response;
    } catch (error) {
      console.error("Error adding todo:", error);
      throw error;
    }
  },

  async updateTodo(
    id: number,
    updates: { todo?: string; completed?: boolean }
  ) {
    try {
      console.log('TodoService: Updating todo:', { id, updates });
      const response = await api.put(`/todos/${id}`, updates);
      console.log('TodoService: Update todo response:', response.data);
      return response;
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  },

  async deleteTodo(id: number) {
    try {
      console.log('TodoService: Deleting todo:', id);
      const response = await api.delete(`/todos/${id}`);
      console.log('TodoService: Delete todo response:', response.data);
      return response;
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  },
};
