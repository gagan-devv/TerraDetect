import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "white" },
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name="landing"
                options={{
                    animation: "fade",
                }}
            />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="register-success" />
        </Stack>
    );
}
