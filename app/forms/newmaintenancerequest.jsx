import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ModalHeader from '../../components/ModalHeader';
import { fetchMaintenanceByFleet } from '../../services/maintenance/fetchMaintenance';
import { pb } from '../../services/pocketbase';

const NewMaintenanceRequest = ({ truckId, closeModal }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTaskName, setSelectedTaskName] = useState("Select a maintenance task");
  const [error, setError] = useState(null);
  const [showTasksModal, setShowTasksModal] = useState(false);

  // Fetch maintenance tasks for the selected truck
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (truckId) {
          const tasks = await fetchMaintenanceByFleet(truckId);
          console.log('Fetched maintenance tasks:', tasks);
          setMaintenanceTasks(tasks);
          if (tasks.length > 0) {
            setSelectedTaskId(tasks[0].id);
            setSelectedTaskName(
              `${tasks[0].taskName} (Every ${tasks[0].formattedInterval})`
            );
          }
        }
      } catch (err) {
        console.error('Error fetching maintenance tasks:', err);
        setError('Failed to load maintenance tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [truckId]);

  const handleTaskSelect = (task) => {
    setSelectedTaskId(task.id);
    setSelectedTaskName(`${task.taskName} (Every ${task.formattedInterval})`);
    setShowTasksModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedTaskId) {
      Alert.alert('Missing Information', 'Please select a maintenance task');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a new maintenance request
      const data = {
        fleet: truckId,
        maintenance: selectedTaskId,
        status: 'pending',
      };

      console.log('Submitting maintenance request:', data);

      // Submit to PocketBase using the maintenance_request collection
      const record = await pb.collection('maintenance_request').create(data);

      Alert.alert('Success', 'Maintenance request submitted successfully', [
        { text: 'OK', onPress: closeModal }
      ]);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      Alert.alert('Error', error.message || 'Failed to submit maintenance request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ModalHeader title="New Maintenance Request" onBack={closeModal} />

      <ScrollView className="flex-1 p-4 pb-24">
        <View className="bg-white rounded-lg mb-6">
          <Text className="text-gray-800 font-bold text-lg mb-4">Request Details</Text>

          {isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text className="text-gray-500 mt-3">Loading maintenance tasks...</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-8">
              <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
              <Text className="text-gray-700 text-center mt-3">{error}</Text>
            </View>
          ) : maintenanceTasks.length === 0 ? (
            <View className="bg-yellow-50 p-4 rounded-lg mb-4">
              <Text className="text-amber-800 text-center">
                No maintenance tasks defined for this truck. Please add maintenance tasks first.
              </Text>
            </View>
          ) : (
            <View className="mb-4">
              <Text className="text-gray-600 mb-1">Maintenance Task</Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                onPress={() => setShowTasksModal(true)}
                disabled={isSubmitting}
              >
                <Text className="text-gray-700">{selectedTaskName}</Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for selecting maintenance task */}
      <Modal
        visible={showTasksModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTasksModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-xl">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-800">Select Maintenance Task</Text>
              <TouchableOpacity onPress={() => setShowTasksModal(false)}>
                <Ionicons name="close" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-96">
              {maintenanceTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  className="p-4 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => handleTaskSelect(task)}
                >
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{task.taskName}</Text>
                    <Text className="text-gray-500 text-sm">Every {task.formattedInterval}</Text>
                  </View>
                  {selectedTaskId === task.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || isLoading || maintenanceTasks.length === 0}
          className={`${
            isSubmitting || isLoading || maintenanceTasks.length === 0
              ? 'bg-gray-400'
              : 'bg-blue-600'
          } rounded-lg py-3 flex-row justify-center items-center`}
        >
          {isSubmitting ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="white" />
              <Text className="text-white font-bold text-center ml-2">Submitting...</Text>
            </>
          ) : (
            <>
              <Ionicons name="construct-outline" size={20} color="white" />
              <Text className="text-white font-bold text-center ml-2">Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NewMaintenanceRequest;