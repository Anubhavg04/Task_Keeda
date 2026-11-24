import { useState, useCallback, useRef } from 'react';
import { taskAPI } from '../services/api.js';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Only failures of loading the list itself (not create/update/delete/bulk failures).
  const [fetchError, setFetchError] = useState(null);
  const [pagination, setPagination] = useState({
    totalTasks: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });
  const latestFetchRef = useRef(0);

  const fetchTasks = useCallback(async (params = {}) => {
    const requestId = latestFetchRef.current + 1;
    latestFetchRef.current = requestId;
    setLoading(true);
    setError(null);
    setFetchError(null);
    try {
      const response = await taskAPI.getTasks(params);
      // A newer request has started; ignore this older response.
      if (requestId !== latestFetchRef.current) return;
      setTasks(response.data.tasks);
      setPagination(response.data.pagination);
    } catch (err) {
      if (requestId !== latestFetchRef.current) return;
      const message = err.response?.data?.message || 'Could not load tasks. Check your connection and try again.';
      setError(message);
      setFetchError(message);
    } finally {
      if (requestId === latestFetchRef.current) setLoading(false);
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
    fetchError,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    bulkUpdateTasks,
    deleteTask,
  };
};