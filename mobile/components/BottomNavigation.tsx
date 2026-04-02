import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export interface BottomNavigationProps {
  className?: string;
}

interface NavItem {
  route: string;
  icon: string;
  iconFilled: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    route: '/(app)/dashboard',
    icon: '📊',
    iconFilled: '📊',
    label: 'Dashboard',
  },
  {
    route: '/(app)/history',
    icon: '📜',
    iconFilled: '📋',
    label: 'History',
  },
  {
    route: '/(app)/output',
    icon: '🔮',
    iconFilled: '🔮',
    label: 'Prediction',
  },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  className = '',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, isGuest } = useAuthStore();

  // Don't show navigation for guest users
  if (!accessToken || isGuest) {
    return null;
  }

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  const isActive = (route: string) => {
    // Extract the screen name from the route
    const screenName = route.split('/').pop();
    return pathname.includes(screenName || '');
  };

  return (
    <View
      className={`
        fixed bottom-0 left-0 w-full
        bg-white/80 dark:bg-slate-900/80
        backdrop-blur-xl
        rounded-t-[2.5rem]
        shadow-[0_-8px_32px_rgba(25,28,29,0.04)]
        px-4 pb-6 pt-3
        flex-row justify-around items-center
        z-50
        ${className}
      `.trim()}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.route);
        
        return (
          <Pressable
            key={item.route}
            onPress={() => handleNavigate(item.route)}
            className={`
              flex flex-col items-center justify-center
              px-5 py-2
              rounded-full
              ${active
                ? 'bg-primary-fixed dark:bg-primary-fixed-dark scale-90'
                : 'bg-transparent'
              }
            `.trim()}
            style={{
              minWidth: 80,
            }}
          >
            {/* Icon */}
            <Text
              className={`
                text-2xl mb-1
                ${active
                  ? 'text-on-primary-fixed dark:text-on-primary-fixed-dark'
                  : 'text-on-surface-variant dark:text-on-surface-variant-dark'
                }
              `.trim()}
            >
              {active ? item.iconFilled : item.icon}
            </Text>
            
            {/* Label */}
            <Text
              className={`
                font-label font-semibold text-[11px] uppercase tracking-wider
                ${active
                  ? 'text-on-primary-fixed dark:text-on-primary-fixed-dark'
                  : 'text-on-surface-variant dark:text-on-surface-variant-dark'
                }
              `.trim()}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
