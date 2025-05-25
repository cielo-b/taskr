import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
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

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState("");
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const headerScale = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const formScale = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(0);
  const inputFocus = useSharedValue(0);
  const switchScale = useSharedValue(0);

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

    switchScale.value = withDelay(400, withSpring(1, {
      damping: 15,
      stiffness: 150,
    }));
  }, []);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await TodoService.getTodoById(Number(id));
      setTask(response.data.todo);
      setCompleted(response.data.completed);
    } catch (error) {
      console.error("Failed to fetch task:", error);
      setError("Failed to fetch task details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!task.trim()) {
      setError("Please enter a task title");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Create optimistic update
      const optimisticUpdate = {
        id: Number(id),
        todo: task.trim(),
        completed,
        userId: 1 // Assuming userId 1 for now
      };

      // Update cache optimistically
      try {
        const cachedData = await AsyncStorage.getItem('todos_cache');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedTodos = parsedData.todos.map((todo: any) => 
            todo.id === Number(id) ? optimisticUpdate : todo
          );
          const updatedData = {
            ...parsedData,
            todos: updatedTodos
          };
          
          // Update cache with optimistic data
          await AsyncStorage.setItem('todos_cache', JSON.stringify(updatedData));
          await AsyncStorage.setItem('todos_cache_timestamp', Date.now().toString());
        }
      } catch (cacheError) {
        console.log('Cache optimistic update failed, continuing with server request');
      }
      
      // Update on server
      const response = await TodoService.updateTodo(Number(id), {
        todo: task.trim(),
        completed,
      });
      
      // Update cache with real server response
      try {
        const cachedData = await AsyncStorage.getItem('todos_cache');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedTodos = parsedData.todos.map((todo: any) => 
            todo.id === Number(id) ? response.data : todo
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
      
      router.back();
    } catch (error) {
      console.error("Failed to update task:", error);
      
      // Revert optimistic update on error
      try {
        const cachedData = await AsyncStorage.getItem('todos_cache');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          // Revert to original values (we need to fetch them again or store them)
          // For now, just clear cache to force refresh
          await AsyncStorage.removeItem('todos_cache');
          await AsyncStorage.removeItem('todos_cache_timestamp');
        }
      } catch (revertError) {
        console.log('Cache revert failed');
      }
      
      setError("Failed to update task");
    } finally {
      setSubmitting(false);
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

  useEffect(() => {
    fetchTask();
  }, [id]);

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

  const switchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: switchScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      inputFocus.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.8)']
    );

    const backgroundColor = interpolateColor(
      inputFocus.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.2)']
    );

    return {
      borderColor,
      backgroundColor,
      transform: [{ scale: 1 + inputFocus.value * 0.02 }],
    };
  });

  if (loading) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
        <LinearGradient
          colors={['#1E293B', '#334155', '#475569']}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <Animated.View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading task...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error && !task) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
        <LinearGradient
          colors={['#DC2626', '#EF4444', '#F87171']}
          style={styles.errorContainer}
        >
          <View style={styles.errorContent}>
            <MaterialIcons name="error-outline" size={80} color="white" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchTask}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.retryButtonGradient}
              >
                <MaterialIcons name="refresh" size={24} color="white" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569', '#64748B']}
        style={styles.container}
      >
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
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.backButtonGradient}
                  >
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                  </LinearGradient>
                </Pressable>
                
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Edit Task</Text>
                  <Text style={styles.headerSubtitle}>Update your task details</Text>
                </View>
              </View>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.formGradient}
              >
                <View style={styles.formContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Task Title</Text>
                    <Animated.View style={[styles.inputWrapper, inputAnimatedStyle]}>
                      <MaterialIcons name="task-alt" size={20} color="rgba(255, 255, 255, 0.6)" />
                      <TextInput
                        value={task}
                        onChangeText={setTask}
                        placeholder="Enter your task..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        style={styles.textInput}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                        multiline
                        numberOfLines={3}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </Animated.View>
                  </View>

                  {/* Completion Status */}
                  <Animated.View style={[styles.switchContainer, switchAnimatedStyle]}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                      style={styles.switchGradient}
                    >
                      <View style={styles.switchContent}>
                        <View style={styles.switchLabelContainer}>
                          <MaterialIcons 
                            name={completed ? "check-circle" : "radio-button-unchecked"} 
                            size={24} 
                            color={completed ? "#10B981" : "rgba(255, 255, 255, 0.6)"} 
                          />
                          <Text style={styles.switchLabel}>Mark as completed</Text>
                        </View>
                        <Switch
                          value={completed}
                          onValueChange={setCompleted}
                          thumbColor={completed ? "#10B981" : "rgba(255, 255, 255, 0.8)"}
                          trackColor={{ 
                            false: "rgba(255, 255, 255, 0.2)", 
                            true: "rgba(16, 185, 129, 0.3)" 
                          }}
                          ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>

                  {error && (
                    <Animated.View style={styles.errorContainer}>
                      <LinearGradient
                        colors={['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.2)']}
                        style={styles.errorGradient}
                      >
                        <MaterialIcons name="error-outline" size={20} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}

                  <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
                    <Pressable
                      onPress={handleSubmit}
                      disabled={submitting || !task.trim()}
                      style={[
                        styles.submitButton,
                        (submitting || !task.trim()) && styles.disabledButton
                      ]}
                    >
                      <LinearGradient
                        colors={
                          submitting || !task.trim()
                            ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                            : ['#10B981', '#059669', '#047857']
                        }
                        style={styles.submitButtonGradient}
                      >
                        {submitting ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <MaterialIcons name="save" size={24} color="white" />
                            <Text style={styles.submitButtonText}>Update Task</Text>
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                </View>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
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
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
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
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'rgba(255, 255, 255, 0.9)',
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
    color: 'white',
    marginLeft: 12,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  switchContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  switchGradient: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
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
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
