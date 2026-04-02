import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export interface ProfileDropdownProps {
  username?: string;
  onLogout?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  username,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      router.replace('/(auth)/landing');
    }
  };

  const handleProfile = () => {
    setIsOpen(false);
    router.push('/(app)/profile' as any);
  };

  return (
    <View>
      {/* Profile Avatar Button */}
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-primary-fixed dark:bg-primary-fixed-dark items-center justify-center overflow-hidden active:opacity-80"
      >
        <Text className="text-xl">👨‍🌾</Text>
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setIsOpen(false)}
        >
          <View className="absolute top-16 right-6 bg-surface-container-low dark:bg-surface-container-low-dark rounded-lg shadow-lg overflow-hidden min-w-[200px]">
            {/* User Info Section */}
            <View className="px-4 py-3 border-b border-outline-variant dark:border-outline-variant-dark">
              <Text className="font-headline font-bold text-base text-on-surface dark:text-on-surface-dark">
                {username || 'User'}
              </Text>
              <Text className="font-label text-xs text-on-surface-variant dark:text-on-surface-variant-dark mt-0.5">
                Farmer Account
              </Text>
            </View>

            {/* Menu Items */}
            <View className="py-2">
              <Pressable
                onPress={handleProfile}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-container-high dark:active:bg-surface-container-high-dark"
              >
                <Text className="text-lg">👤</Text>
                <Text className="font-label font-medium text-sm text-on-surface dark:text-on-surface-dark">
                  View Profile
                </Text>
              </Pressable>

              <View className="h-px bg-outline-variant dark:bg-outline-variant-dark mx-2 my-1" />

              <Pressable
                onPress={handleLogout}
                className="flex-row items-center gap-3 px-4 py-3 active:bg-error-container/20 dark:active:bg-error-container-dark/20"
              >
                <Text className="text-lg">🚪</Text>
                <Text className="font-label font-medium text-sm text-error dark:text-error-dark">
                  Logout
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};
