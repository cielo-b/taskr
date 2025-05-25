import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Taskr
      </Text>
      <Text className="text-lg text-gray-600 mb-8 text-center">
        Your simple and efficient task management solution.
      </Text>

      <Link href="/(tabs)" asChild>
        <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg">
          <Text className="text-white font-medium">Get Started</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
