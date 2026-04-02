import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const { username, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username || '');

  const handleSave = () => {
    // TODO: Implement profile update API call
    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/landing');
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      {/* Top App Bar */}
      <View className="bg-white/80 dark:bg-slate-900/80 shadow-sm px-6 py-4 flex-row items-center gap-3 pt-12">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-container dark:active:bg-surface-container-dark"
        >
          <Text className="text-2xl">←</Text>
        </Pressable>
        <Text className="font-headline font-bold text-2xl text-primary dark:text-primary-dark tracking-tight flex-1">
          Profile
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-6 pt-6">
          {/* Profile Header Card */}
          <View className="bg-surface-container-lowest dark:bg-surface-container-lowest-dark rounded-lg p-8 mb-6 items-center">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-primary dark:bg-primary-dark items-center justify-center mb-4">
              <Text className="text-5xl">👨‍🌾</Text>
            </View>

            {/* Username */}
            {isEditing ? (
              <TextInput
                value={editedUsername}
                onChangeText={setEditedUsername}
                className="font-headline font-bold text-2xl text-on-surface dark:text-on-surface-dark text-center bg-surface-container-high dark:bg-surface-container-high-dark px-4 py-2 rounded-full mb-4"
                autoFocus
              />
            ) : (
              <Text className="font-headline font-bold text-2xl text-on-surface dark:text-on-surface-dark mb-4">
                {username || 'Farmer'}
              </Text>
            )}

            {/* Edit/Save Button */}
            {isEditing ? (
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setIsEditing(false);
                    setEditedUsername(username || '');
                  }}
                  className="bg-surface-container-high dark:bg-surface-container-high-dark px-6 py-2 rounded-full"
                >
                  <Text className="font-label font-semibold text-on-surface dark:text-on-surface-dark">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  className="bg-primary dark:bg-primary-dark px-6 py-2 rounded-full"
                >
                  <Text className="font-label font-semibold text-on-primary dark:text-on-primary-dark">
                    Save
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditing(true)}
                className="bg-surface-container-high dark:bg-surface-container-high-dark px-6 py-2 rounded-full"
              >
                <Text className="font-label font-semibold text-on-surface dark:text-on-surface-dark">
                  Edit Profile
                </Text>
              </Pressable>
            )}
          </View>

          {/* Account Information */}
          <View className="mb-6">
            <Text className="font-headline font-bold text-xl text-on-surface dark:text-on-surface-dark mb-4">
              Account Information
            </Text>

            <View className="bg-surface-container-lowest dark:bg-surface-container-lowest-dark rounded-lg overflow-hidden">
              <View className="px-5 py-4 border-b border-outline-variant/20 dark:border-outline-variant-dark/20">
                <Text className="font-label text-xs text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider mb-1">
                  Username
                </Text>
                <Text className="font-body text-base text-on-surface dark:text-on-surface-dark">
                  {username || 'Not set'}
                </Text>
              </View>

              <View className="px-5 py-4">
                <Text className="font-label text-xs text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider mb-1">
                  Account Type
                </Text>
                <Text className="font-body text-base text-on-surface dark:text-on-surface-dark">
                  Farmer Account
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics */}
          <View className="mb-6">
            <Text className="font-headline font-bold text-xl text-on-surface dark:text-on-surface-dark mb-4">
              Your Statistics
            </Text>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-primary/10 dark:bg-primary-dark/20 rounded-lg p-4">
                <Text className="font-headline font-black text-3xl text-primary dark:text-primary-dark mb-1">
                  127
                </Text>
                <Text className="font-label text-xs text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider">
                  Total Readings
                </Text>
              </View>

              <View className="flex-1 bg-secondary/10 dark:bg-secondary-dark/20 rounded-lg p-4">
                <Text className="font-headline font-black text-3xl text-secondary dark:text-secondary-dark mb-1">
                  42
                </Text>
                <Text className="font-label text-xs text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-wider">
                  Predictions
                </Text>
              </View>
            </View>
          </View>

          {/* Settings Section */}
          <View className="mb-6">
            <Text className="font-headline font-bold text-xl text-on-surface dark:text-on-surface-dark mb-4">
              Settings
            </Text>

            <View className="bg-surface-container-lowest dark:bg-surface-container-lowest-dark rounded-lg overflow-hidden">
              <Pressable className="flex-row items-center justify-between px-5 py-4 border-b border-outline-variant/20 dark:border-outline-variant-dark/20 active:bg-surface-container-high dark:active:bg-surface-container-high-dark">
                <View className="flex-row items-center gap-3">
                  <Text className="text-xl">🔔</Text>
                  <Text className="font-label font-medium text-base text-on-surface dark:text-on-surface-dark">
                    Notifications
                  </Text>
                </View>
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark">→</Text>
              </Pressable>

              <Pressable className="flex-row items-center justify-between px-5 py-4 border-b border-outline-variant/20 dark:border-outline-variant-dark/20 active:bg-surface-container-high dark:active:bg-surface-container-high-dark">
                <View className="flex-row items-center gap-3">
                  <Text className="text-xl">🌓</Text>
                  <Text className="font-label font-medium text-base text-on-surface dark:text-on-surface-dark">
                    Theme
                  </Text>
                </View>
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark">→</Text>
              </Pressable>

              <Pressable className="flex-row items-center justify-between px-5 py-4 active:bg-surface-container-high dark:active:bg-surface-container-high-dark">
                <View className="flex-row items-center gap-3">
                  <Text className="text-xl">🔒</Text>
                  <Text className="font-label font-medium text-base text-on-surface dark:text-on-surface-dark">
                    Privacy & Security
                  </Text>
                </View>
                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark">→</Text>
              </Pressable>
            </View>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            className="mb-8 rounded-full overflow-hidden"
          >
            <View className="bg-error-container dark:bg-error-container-dark py-4 items-center justify-center rounded-full">
              <Text className="text-error dark:text-error-dark font-headline font-bold text-base">
                🚪  Logout
              </Text>
            </View>
          </Pressable>

          {/* App Version */}
          <Text className="text-center text-on-surface-variant dark:text-on-surface-variant-dark font-label text-xs mb-4">
            TerraDetect v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
