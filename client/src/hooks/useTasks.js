import { useState, useCallback } from 'react';
import { taskAPI } from '../services/api.js';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    totalTasks: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskAPI.getTasks(params);
      setTasks(response.data.tasks);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (taskData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskAPI.createTask(taskData);
      setTasks(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, taskData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskAPI.updateTask(id, taskData);
      setTasks(prev =>
        prev.map(task => task._id === id ? response.data : task)
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateTasks = async (taskIds, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await taskAPI.bulkUpdateTasks({ taskIds, ...updates });
      const updatedTasks = new Map(response.data.tasks.map((task) => [task._id, task]));
      setTasks((current) => current.map((task) => updatedTasks.get(task._id) || task));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update selected tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await taskAPI.deleteTask(id);
      setTasks(prev => prev.filter(task => task._id !== id));
      setPagination(current => ({
        ...current,
        totalTasks: Math.max(0, current.totalTasks - 1),
        totalPages: Math.max(1, Math.ceil((current.totalTasks - 1) / current.limit)),
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    bulkUpdateTasks,
    deleteTask,
  };
};
