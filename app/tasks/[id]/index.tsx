import { View, Text, TouchableOpacity, Alert, StatusBar } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Todo } from "@/types/todo";
import { TodoService } from "@/services/tasks";

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    try {
      const data = await TodoService.getTodoById(Number(id));
      setTask(data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch task details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await TodoService.deleteTodo(Number(id));
      router.replace("/(tabs)");
      Alert.alert("Success", "Task deleted successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to delete task");
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center">
          <Text>Loading...</Text>
        </View>
      </View>
    );
  if (!task)
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View className="flex-1 items-center justify-center">
          <Text>Task not found</Text>
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View className="flex-1 p-4">
        <View className="bg-white p-6 rounded-lg shadow-sm">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {task.todo}
          </Text>

          <View className="flex-row items-center mb-4">
            <View
              className={`w-3 h-3 rounded-full mr-2 ${
                task.completed ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <Text className="text-gray-700">
              {task.completed ? "Completed" : "Pending"}
            </Text>
          </View>

          <Text className="text-gray-500 mb-6">User ID: {task.userId}</Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-lg"
              onPress={() => router.push(`/tasks/${id}/edit`)}
            >
              <Text className="text-white">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 px-4 py-2 rounded-lg"
              onPress={handleDelete}
            >
              <Text className="text-white">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
