import api from "./api";

export const TodoService = {
  async getAllTodos(limit = 30, skip = 0) {
    try {
      return await api.get("/todos", {
        params: { limit, skip },
      });
    } catch (error) {
      console.error("Error fetching todos:", error);
      throw error;
    }
  },

  async getTodoById(id: number) {
    try {
      return await api.get(`/todos/${id}`);
    } catch (error) {
      console.error("Error fetching todo:", error);
      throw error;
    }
  },

  // Get random todo
  async getRandomTodo(count = 1) {
    try {
      return await api.get(`/todos/random${count > 1 ? `/${count}` : ""}`);
    } catch (error) {
      console.error("Error fetching random todo:", error);
      throw error;
    }
  },

  // Get todos by user ID
  async getTodosByUserId(userId: number) {
    try {
      return await api.get(`/todos/user/${userId}`);
    } catch (error) {
      console.error("Error fetching user todos:", error);
      throw error;
    }
  },

  async addTodo(todo: string, completed: boolean, userId: number) {
    try {
      return await api.post("/todos/add", {
        todo,
        completed,
        userId,
      });
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
      return await api.put(`/todos/${id}`, updates);
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  },

  async deleteTodo(id: number) {
    try {
      return await api.delete(`/todos/${id}`);
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  },
};
