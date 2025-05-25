import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Todo } from '@/types/todo';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Responsive utilities
const isSmallScreen = width < 360;
const isMediumScreen = width >= 360 && width < 400;
const isLargeScreen = width >= 400;

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: number, currentStatus: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  index: number;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggleComplete, onEdit, onDelete, index }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const checkboxScale = useSharedValue(0);
  const completionProgress = useSharedValue(todo.completed ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance animation
    const delay = index * 100;
    
    scale.value = withDelay(delay, withSpring(1, {
      damping: 15,
      stiffness: 150,
    }));
    
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    
    translateY.value = withDelay(delay, withSpring(0, {
      damping: 20,
      stiffness: 100,
    }));

    checkboxScale.value = withDelay(delay + 200, withSpring(1, {
      damping: 12,
      stiffness: 200,
    }));
  }, []);

  useEffect(() => {
    completionProgress.value = withSpring(todo.completed ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [todo.completed]);

  const handlePress = () => {
    pressScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    runOnJS(onToggleComplete)(todo.id, todo.completed);
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pressScale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      completionProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.15)', '#10B981']
    );

    const borderColor = interpolateColor(
      completionProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.4)', '#10B981']
    );

    return {
      backgroundColor,
      borderColor,
      transform: [
        { scale: checkboxScale.value },
        { rotate: `${completionProgress.value * 360}deg` }
      ],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      completionProgress.value,
      [0, 1],
      ['#1F2937', 'rgba(31, 41, 55, 0.5)']
    );

    return {
      color,
      transform: [{ scale: 1 - completionProgress.value * 0.05 }],
    };
  });

  const strikethroughAnimatedStyle = useAnimatedStyle(() => ({
    width: `${completionProgress.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient
        colors={todo.completed 
          ? ['#10B981', '#059669', '#047857']
          : ['#3B82F6', '#1D4ED8', '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.innerContainer}>
          {/* Main Task Content */}
          <Pressable
            onPress={handlePress}
            style={styles.taskContent}
            android_ripple={{ 
              color: 'rgba(255, 255, 255, 0.2)', 
              borderless: false,
            }}
          >
            <Animated.View style={[styles.checkbox, checkboxAnimatedStyle]}>
              {todo.completed && (
                <Animated.View style={{ transform: [{ scale: completionProgress }] }}>
                  <MaterialIcons name="check" size={getResponsiveSize(16, 18, 20)} color="white" />
                </Animated.View>
              )}
            </Animated.View>

            <View style={styles.textContainer}>
              <View style={styles.titleContainer}>
                <Animated.Text style={[styles.todoText, textAnimatedStyle]}>
                  {todo.todo}
                </Animated.Text>
                {todo.completed && (
                  <Animated.View style={[styles.strikethrough, strikethroughAnimatedStyle]} />
                )}
              </View>
              
              <View style={styles.metaContainer}>
                <View style={styles.userBadge}>
                  <MaterialIcons name="person" size={getResponsiveSize(10, 12, 14)} color="rgba(31, 41, 55, 0.7)" />
                  <Text style={styles.userIdText}>User {todo.userId}</Text>
                </View>
                
                <View style={[styles.statusBadge, todo.completed ? styles.completedBadge : styles.pendingBadge]}>
                  <View style={[styles.statusDot, todo.completed ? styles.completedDot : styles.pendingDot]} />
                  <Text style={styles.statusText}>
                    {todo.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.priorityIndicator}>
              <LinearGradient
                colors={todo.completed 
                  ? ['#10B981', '#059669'] 
                  : ['#F59E0B', '#D97706']}
                style={styles.priorityGradient}
              />
            </View>
          </Pressable>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Pressable
              onPress={() => onEdit(todo)}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="edit" size={getResponsiveSize(16, 18, 20)} color="white" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </LinearGradient>
            </Pressable>
            
            <Pressable
              onPress={() => onDelete(todo.id)}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="delete" size={getResponsiveSize(16, 18, 20)} color="white" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    paddingHorizontal: 0,
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  gradientContainer: {
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  innerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 2,
    overflow: 'hidden',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(16, 20, 24),
    minHeight: getResponsiveSize(70, 80, 90),
  },
  checkbox: {
    width: getResponsiveSize(24, 28, 32),
    height: getResponsiveSize(24, 28, 32),
    borderRadius: getResponsiveSize(12, 14, 16),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    marginRight: getResponsiveSize(8, 12, 16),
  },
  titleContainer: {
    position: 'relative',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  todoText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    lineHeight: getResponsiveSize(18, 22, 26),
    color: '#1F2937',
  },
  strikethrough: {
    position: 'absolute',
    top: '50%',
    left: 0,
    height: 2,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.1)',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(3, 4, 5),
    borderRadius: getResponsiveSize(10, 12, 14),
  },
  userIdText: {
    fontSize: getResponsiveSize(9, 11, 13),
    color: 'rgba(31, 41, 55, 0.7)',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(3, 4, 5),
    borderRadius: getResponsiveSize(10, 12, 14),
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusDot: {
    width: getResponsiveSize(4, 6, 8),
    height: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(2, 3, 4),
    marginRight: 4,
  },
  completedDot: {
    backgroundColor: '#10B981',
  },
  pendingDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: getResponsiveSize(8, 10, 12),
    fontWeight: '600',
    color: 'rgba(31, 41, 55, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityIndicator: {
    width: getResponsiveSize(3, 4, 5),
    height: getResponsiveSize(30, 40, 50),
    borderRadius: 2,
    overflow: 'hidden',
  },
  priorityGradient: {
    flex: 1,
    borderRadius: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingBottom: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(8, 12, 16),
  },
  actionButton: {
    flex: 1,
    borderRadius: getResponsiveSize(10, 12, 14),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: getResponsiveSize(12, 14, 16),
    marginLeft: getResponsiveSize(4, 6, 8),
  },
});

export default TodoItem; 