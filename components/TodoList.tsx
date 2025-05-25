import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, Dimensions, Modal, StatusBar, Platform } from "react-native";
import { Todo, TodoListResponse } from "../types/todo";
import { TodoService } from "@/services/tasks";
import TodoItem from "./TodoItem";
import { MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
  runOnJS,
  withDelay,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const CACHE_KEY = 'todos_cache';
const CACHE_TIMESTAMP_KEY = 'todos_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ limit: 10, skip: 0, total: 0 });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<number | null>(null);
  const [showPagination, setShowPagination] = useState(false);

  const insets = useSafeAreaInsets();

  // Calculate responsive spacing
  const tabBarHeight = 70;
  const tabBarBottomMargin = Platform.OS === 'ios' ? insets.bottom + 10 : 5;
  const totalTabBarSpace = tabBarHeight + tabBarBottomMargin + 20; // Extra padding
  const paginationHeight = 60;
  const fabSize = 60;
  const fabBottomMargin = totalTabBarSpace + 20;
  const paginationBottomMargin = totalTabBarSpace + fabSize + 30;

  // Animation values
  const addButtonScale = useSharedValue(0);
  const addButtonRotation = useSharedValue(0);
  const fabScale = useSharedValue(1);
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const logoGlow = useSharedValue(0);
  const paginationOpacity = useSharedValue(0);
  const paginationTranslateY = useSharedValue(50);

  useEffect(() => {
    // Ensure navigation bar stays hidden
    if (Platform.OS === 'android') {
      const interval = setInterval(async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
        } catch (error) {
          // Silently handle error
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    // Logo entrance animation
    logoScale.value = withDelay(200, withSpring(1, {
      damping: 15,
      stiffness: 150,
    }));
    
    // Logo glow animation
    logoGlow.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    ));

    // Add button entrance animation
    addButtonScale.value = withDelay(300, withSpring(1, {
      damping: 12,
      stiffness: 200,
    }));
  }, []);

  useEffect(() => {
    if (deleteModalVisible) {
      modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      modalOpacity.value = withTiming(1, { duration: 300 });
    } else {
      modalScale.value = withSpring(0, { damping: 15, stiffness: 150 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [deleteModalVisible]);

  useEffect(() => {
    if (showPagination) {
      paginationOpacity.value = withTiming(1, { duration: 300 });
      paginationTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      paginationOpacity.value = withTiming(0, { duration: 200 });
      paginationTranslateY.value = withSpring(50, { damping: 15, stiffness: 150 });
    }
  }, [showPagination]);

  const saveToCache = async (data: TodoListResponse) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('Data saved to cache');
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  const loadFromCache = async (): Promise<TodoListResponse | null> => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp);
        const now = Date.now();
        
        if (now - timestamp < CACHE_DURATION) {
          console.log('Loading data from cache');
          return JSON.parse(cachedData);
        } else {
          console.log('Cache expired');
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load from cache:', error);
      return null;
    }
  };

  const fetchTodos = async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);
      console.log('TodoList: Starting fetchTodos...', { limit: pagination.limit, skip: pagination.skip });
      
      // Try to load from cache first
      if (useCache && pagination.skip === 0) {
        const cachedData = await loadFromCache();
        if (cachedData) {
          setTodos(cachedData.todos);
          setPagination(prev => ({ ...prev, total: cachedData.total || 0 }));
          setLoading(false);
          return;
        }
      }

      const response = await TodoService.getAllTodos(
        pagination.limit,
        pagination.skip
      );
      console.log('TodoList: Response received:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const data: TodoListResponse = response.data;
      console.log('TodoList: Parsed data:', data);
      
      if (!data.todos || !Array.isArray(data.todos)) {
        throw new Error('Invalid todos data received');
      }
      
      setTodos(data.todos);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
      
      // Save to cache only for first page
      if (pagination.skip === 0) {
        await saveToCache(data);
      }
      
      console.log('TodoList: State updated successfully');
    } catch (err: any) {
      console.error('TodoList: Error in fetchTodos:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch todos");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('TodoList: fetchTodos completed');
    }
  };

  useEffect(() => {
    console.log('TodoList: useEffect triggered, calling fetchTodos');
    fetchTodos();
  }, [pagination.skip]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTodos(false); // Don't use cache on refresh
  };

  const handleAddTodo = () => {
    // Animate button press
    fabScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    addButtonRotation.value = withSequence(
      withTiming(180, { duration: 200 }),
      withTiming(360, { duration: 200 })
    );
    
    setTimeout(() => {
      addButtonRotation.value = 0;
    }, 400);
    
    router.push('/(tabs)/add');
  };

  const handleDeleteTodo = (id: number) => {
    setTodoToDelete(id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!todoToDelete) return;

    // Optimistic update - remove from UI immediately
    const todoToRemove = todos.find(t => t.id === todoToDelete);
    setTodos(prev => prev.filter(todo => todo.id !== todoToDelete));
    setDeleteModalVisible(false);
    setTodoToDelete(null);

    try {
      await TodoService.deleteTodo(todoToDelete);
      // Clear cache since data changed
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (err) {
      console.error('Error deleting todo:', err);
      // Revert optimistic update on error
      if (todoToRemove) {
        setTodos(prev => [...prev, todoToRemove].sort((a, b) => a.id - b.id));
      }
      setError("Failed to delete todo");
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setTodoToDelete(null);
  };

  const handleToggleComplete = async (id: number, currentStatus: boolean) => {
    // Optimistic update
    setTodos(prev =>
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !currentStatus } : todo
      )
    );

    try {
      console.log('Toggling todo completion:', { id, currentStatus });
      const updatedTodo = await TodoService.updateTodo(id, {
        completed: !currentStatus,
      });
      console.log('Todo updated:', updatedTodo.data);
      
      // Update with server response
      setTodos(prev =>
        prev.map(todo => todo.id === id ? updatedTodo.data : todo)
      );
      
      // Clear cache since data changed
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (err) {
      console.error('Error updating todo:', err);
      // Revert optimistic update on error
      setTodos(prev =>
        prev.map(todo => 
          todo.id === id ? { ...todo, completed: currentStatus } : todo
        )
      );
      setError("Failed to update todo");
    }
  };

  const handleEditTodo = (todo: Todo) => {
    router.push(`/tasks/${todo.id}/edit`);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Show pagination when user is 100px from bottom
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    // Only show pagination if there are multiple pages
    const hasMultiplePages = pagination.total > pagination.limit;
    
    if (isCloseToBottom && hasMultiplePages && !showPagination) {
      setShowPagination(true);
    } else if (!isCloseToBottom && showPagination) {
      setShowPagination(false);
    }
  };

  // Function to add new todo optimistically at the top
  const addTodoOptimistically = (newTodo: Todo) => {
    setTodos(prev => [newTodo, ...prev]);
  };

  // Function to update todo optimistically
  const updateTodoOptimistically = (updatedTodo: Todo) => {
    setTodos(prev =>
      prev.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)
    );
  };

  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: addButtonScale.value * fabScale.value },
      { rotate: `${addButtonRotation.value}deg` }
    ],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const paginationAnimatedStyle = useAnimatedStyle(() => ({
    opacity: paginationOpacity.value,
    transform: [{ translateY: paginationTranslateY.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolateColor(
      logoGlow.value,
      [0, 1],
      ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.6)']
    );

    return {
      transform: [{ scale: logoScale.value }],
      shadowColor: glowOpacity,
    };
  });

  console.log('TodoList: Rendering with state:', { loading, error, todosCount: todos.length });

  if (loading && pagination.skip === 0 && !refreshing) {
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
            <Text style={styles.loadingText}>Loading your tasks...</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error && todos.length === 0) {
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
            <Pressable style={styles.retryButton} onPress={() => fetchTodos(false)}>
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
        style={styles.backgroundGradient}
      >
        {/* Logo Header */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8', '#1E40AF']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>Taskr</Text>
          </LinearGradient>
          <View style={styles.logoUnderline}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#A855F7']}
              style={styles.underlineGradient}
            />
          </View>
        </Animated.View>

        <FlatList
          data={todos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: paginationBottomMargin + paginationHeight + 20 }
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <TodoItem 
              todo={item} 
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTodo}
              onDelete={handleDeleteTodo}
              index={index}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.emptyContent}
              >
                <MaterialIcons name="task-alt" size={80} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.emptyText}>No tasks yet</Text>
                <Text style={styles.emptySubText}>Pull to refresh or add your first task!</Text>
              </LinearGradient>
            </View>
          }
        />

        {/* Floating Action Button */}
        <Animated.View style={[
          styles.fab, 
          addButtonAnimatedStyle,
          { bottom: fabBottomMargin }
        ]}>
          <Pressable onPress={handleAddTodo} style={styles.fabPressable}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8', '#1E40AF']}
              style={styles.fabGradient}
            >
              <MaterialIcons name="add" size={28} color="white" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Pagination */}
        <Animated.View style={[
          styles.paginationContainer,
          { bottom: paginationBottomMargin },
          paginationAnimatedStyle
        ]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.paginationGradient}
          >
            <Pressable
              onPress={() =>
                setPagination(prev => ({
                  ...prev,
                  skip: Math.max(0, prev.skip - prev.limit),
                }))
              }
              disabled={pagination.skip === 0}
              style={[
                styles.paginationButton,
                pagination.skip === 0 && styles.disabledButton
              ]}
            >
              <MaterialIcons name="chevron-left" size={24} color="white" />
              <Text style={styles.paginationText}>Previous</Text>
            </Pressable>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageInfo}>
                {Math.floor(pagination.skip / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }))
              }
              disabled={pagination.skip + pagination.limit >= pagination.total}
              style={[
                styles.paginationButton,
                pagination.skip + pagination.limit >= pagination.total && styles.disabledButton
              ]}
            >
              <Text style={styles.paginationText}>Next</Text>
              <MaterialIcons name="chevron-right" size={24} color="white" />
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={cancelDelete}
        >
          <Animated.View style={[styles.modalBackdrop, modalBackdropStyle]}>
            <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
              <LinearGradient
                colors={['#1E293B', '#334155', '#475569']}
                style={styles.modalGradient}
              >
                <View style={styles.modalContent}>
                  <MaterialIcons name="warning" size={60} color="#EF4444" />
                  <Text style={styles.modalTitle}>Delete Task</Text>
                  <Text style={styles.modalMessage}>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <Pressable style={styles.modalButton} onPress={cancelDelete}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </LinearGradient>
                    </Pressable>
                    
                    <Pressable style={styles.modalButton} onPress={confirmDelete}>
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Delete</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </Modal>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  backgroundGradient: {
    flex: 1,
    width: width,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  logoUnderline: {
    marginTop: 8,
    width: 80,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  underlineGradient: {
    flex: 1,
    borderRadius: 2,
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
  loadingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
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
  listContainer: {
    paddingTop: 20,
    paddingHorizontal: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    borderRadius: 30,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabPressable: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
    height: 60,
  },
  paginationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 60,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  paginationText: {
    color: 'white',
    fontWeight: '600',
    marginHorizontal: 8,
    fontSize: 14,
  },
  pageIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  pageInfo: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalGradient: {
    borderRadius: 20,
  },
  modalContent: {
    padding: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TodoList;
