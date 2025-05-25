import { View } from "react-native";
import TodoList from "@/components/TodoList";

export default function TaskListScreen() {
  return (
    <View className="flex-1">
      <TodoList />
    </View>
  );
}
