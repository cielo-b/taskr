import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { TodoService } from "@/services/tasks";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function AddTaskScreen() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const headerScale = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const formScale = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(0);
  const inputFocus = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    headerScale.value = withDelay(100, withSpring(1, {
      damping: 15,
      stiffness: 150,
    }));
    
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    
    formScale.value = withDelay(300, withSpring(1, {
      damping: 20,
      stiffness: 100,
    }));
    
    formTranslateY.value = withDelay(300, withSpring(0, {
      damping: 20,
      stiffness: 100,
    }));
    
    buttonScale.value = withDelay(500, withSpring(1, {
      damping: 12,
      stiffness: 200,
    }));
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create optimistic todo with temporary ID
      const optimisticTodo = {
        id: Date.now(), // Temporary ID using timestamp
        todo: title.trim(),
        completed: false,
        userId: 1
      };

      // Get current todos from cache to add the new one at the top
      try {
        const cachedData = await AsyncStorage.getItem('todos_cache');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedTodos = [optimisticTodo, ...parsedData.todos];
          const updatedData = {
            ...parsedData,
            todos: updatedTodos,
            total: parsedData.total + 1
          };
          
          // Update cache with optimistic data
          await AsyncStorage.setItem('todos_cache', JSON.stringify(updatedData));
          await AsyncStorage.setItem('todos_cache_timestamp', Date.now().toString());
        }
      } catch (cacheError) {
        console.log('Cache update failed, continuing with server request');
      }

      // Add to server
      const response = await TodoService.addTodo(title.trim(), false, 1);
      
      // Update cache with real server response
      try {
        const cachedData = await AsyncStorage.getItem('todos_cache');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          // Replace the optimistic todo with the real one from server
          const updatedTodos = parsedData.todos.map((todo: any) => 
            todo.id === optimisticTodo.id ? response.data : todo
          );
          const updatedData = {
            ...parsedData,
            todos: updatedTodos
          };
          
          await AsyncStorage.setItem('todos_cache', JSON.stringify(updatedData));
        }
      } catch (cacheError) {
        console.log('Cache final update failed');
        // Clear cache to force refresh
        await AsyncStorage.removeItem('todos_cache');
        await AsyncStorage.removeItem('todos_cache_timestamp');
      }
      
      // Clear the form
      setTitle("");
      
      // Navigate back to tasks list
      router.back();
    } catch (err) {
      console.error('Error adding task:', err);
      
      // Revert optimistic update on error
      try {
        const cachedData = await AsyncStorage.getItem('todos_cache');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const revertedTodos = parsedData.todos.filter((todo: any) => todo.id !== Date.now());
          const revertedData = {
            ...parsedData,
            todos: revertedTodos,
            total: Math.max(0, parsedData.total - 1)
          };
          
          await AsyncStorage.setItem('todos_cache', JSON.stringify(revertedData));
        }
      } catch (revertError) {
        // Clear cache if revert fails
        await AsyncStorage.removeItem('todos_cache');
        await AsyncStorage.removeItem('todos_cache_timestamp');
      }
      
      setError("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    inputFocus.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handleInputBlur = () => {
    inputFocus.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: formScale.value },
      { translateY: formTranslateY.value }
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      inputFocus.value,
      [0, 1],
      ['rgba(0, 0, 0, 0.2)', 'rgba(59, 130, 246, 0.6)']
    );

    const backgroundColor = interpolateColor(
      inputFocus.value,
      [0, 1],
      ['rgba(0, 0, 0, 0.05)', 'rgba(59, 130, 246, 0.1)']
    );

    return {
      borderColor,
      backgroundColor,
      transform: [{ scale: 1 + inputFocus.value * 0.02 }],
    };
  });

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
              <View style={styles.headerContent}>
                <Pressable
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <View style={styles.backButtonGradient}>
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                  </View>
                </Pressable>
                
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Create New Task</Text>
                  <Text style={styles.headerSubtitle}>Add a new task to your list</Text>
                </View>
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
              <View style={styles.formGradient}>
                <View style={styles.formContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Task Title</Text>
                    <Animated.View style={[styles.inputWrapper, inputAnimatedStyle]}>
                      <MaterialIcons name="task-alt" size={20} color="rgba(0, 0, 0, 0.6)" />
                      <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter your task..."
                        placeholderTextColor="rgba(0, 0, 0, 0.5)"
                        style={styles.textInput}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                        multiline
                        numberOfLines={3}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </Animated.View>
                  </View>

                  {error && (
                    <Animated.View style={styles.errorContainer}>
                      <View style={styles.errorGradient}>
                        <MaterialIcons name="error-outline" size={20} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    </Animated.View>
                  )}

                  <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
                    <Pressable
                      onPress={handleSubmit}
                      disabled={loading || !title.trim()}
                      style={[
                        styles.submitButton,
                        (loading || !title.trim()) && styles.disabledButton
                      ]}
                    >
                      <View style={[
                        styles.submitButtonGradient,
                        (loading || !title.trim()) && styles.disabledButtonGradient
                      ]}>
                        {loading ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <MaterialIcons name="add-task" size={24} color="white" />
                            <Text style={styles.submitButtonText}>Create Task</Text>
                          </>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>

            {/* Tips Section */}
            <Animated.View style={[styles.tipsContainer, formAnimatedStyle]}>
              <View style={styles.tipsGradient}>
                <View style={styles.tipsContent}>
                  <MaterialIcons name="lightbulb-outline" size={24} color="#3B82F6" />
                  <Text style={styles.tipsTitle}>Tips for better tasks</Text>
                  <View style={styles.tipsList}>
                    <View style={styles.tipItem}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>Be specific and clear</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>Set realistic goals</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>Break down complex tasks</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
    width: width,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  formContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  formGradient: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  formContent: {
    padding: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  errorContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonGradient: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  tipsContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tipsGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tipsContent: {
    padding: 20,
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 16,
  },
  tipsList: {
    width: '100%',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
