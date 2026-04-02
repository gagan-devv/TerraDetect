/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function LandingScreen() {
    const router = useRouter();

    // Wrapper that uses LinearGradient on native, plain View on web for reliability
    const GradientHero = ({ children }: { children: React.ReactNode }) => {
        if (Platform.OS === "web") {
            // style uses a CSS string only valid on web; suppress the typed-any lint warning here

            return (
                <View style={{ background: "linear-gradient(180deg, #e8fdf0 0%, #f8f9fa 100%)" } as any} className="relative">
                    {children}
                </View>
            );
        }
        return (
            <LinearGradient colors={(['#e8fdf0', '#f8f9fa'] as const)} className="relative">
                {children}
            </LinearGradient>
        );
    };

    const GradientButton = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => {
        if (Platform.OS === "web") {
            // style uses a CSS string only valid on web; suppress the typed-any lint warning here

            return (
                <Pressable
                    onPress={onPress}
                    style={{ background: "linear-gradient(135deg, #006b2c, #00873a)" } as any}
                    className="rounded-full py-5 items-center justify-center flex-row gap-2 mb-4 active:opacity-90"
                >
                    {children}
                </Pressable>
            );
        }
        return (
            <Pressable onPress={onPress} className="rounded-full overflow-hidden mb-4 active:scale-95">
                <LinearGradient
                    colors={(['#006b2c', '#00873a'] as const)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-5 items-center justify-center flex-row gap-2"
                >
                    {children}
                </LinearGradient>
            </Pressable>
        );
    };

    return (
        <ScrollView className="flex-1 bg-background dark:bg-surface-dark">
            {/* ── Hero Section ── */}
            <GradientHero>
                {/* Decorative blobs */}
                <View
                    className="absolute top-0 right-0 w-64 h-64 rounded-full"
                    style={{ backgroundColor: "rgba(98,223,125,0.15)", top: -40, right: -40, zIndex: 0 }}
                />
                <View
                    className="absolute w-48 h-48 rounded-full"
                    style={{ backgroundColor: "rgba(91,184,254,0.10)", bottom: 40, left: -30, zIndex: 0 }}
                />

                <View className="px-8 pt-20 pb-12 items-center" style={{ zIndex: 1 }}>
                    {/* Editorial Badge */}
                    <View className="bg-primary-fixed dark:bg-primary-fixed px-5 py-1.5 rounded-full mb-6">
                        <Text className="font-label font-bold text-xs text-on-primary-fixed uppercase tracking-widest">
                            The Future of Agronomy
                        </Text>
                    </View>

                    {/* Logo */}
                    <View className="w-24 h-24 bg-primary-container dark:bg-primary-container-dark rounded-[28px] items-center justify-center mb-6">
                        <Text className="text-5xl">🌱</Text>
                    </View>

                    {/* Headline */}
                    <Text className="font-headline text-5xl font-extrabold text-on-surface dark:text-on-surface-dark text-center mb-4 tracking-tight leading-tight">
                        Cultivate with{"\n"}
                        <Text className="text-primary dark:text-primary-dark">Precision</Text> Data.
                    </Text>

                    {/* Subtitle */}
                    <Text className="font-body text-on-surface-variant dark:text-on-surface-variant-dark text-center text-lg leading-7 mb-10 max-w-sm">
                        Real-time soil monitoring and AI-powered crop recommendations. We bridge the gap between biological intuition and digital intelligence.
                    </Text>

                    {/* Feature Pills */}
                    <View className="flex-row flex-wrap justify-center gap-3 mb-10">
                        <View className="bg-secondary-container dark:bg-secondary-container-dark px-5 py-2.5 rounded-full">
                            <Text className="text-on-secondary-container dark:text-on-secondary-container-dark font-label font-semibold text-sm">
                                🌡️ Live Monitoring
                            </Text>
                        </View>
                        <View className="bg-tertiary-container dark:bg-tertiary-container-dark px-5 py-2.5 rounded-full">
                            <Text className="text-on-tertiary-container dark:text-on-tertiary-container-dark font-label font-semibold text-sm">
                                🤖 AI Predictions
                            </Text>
                        </View>
                        <View className="bg-primary-fixed dark:bg-primary-fixed px-5 py-2.5 rounded-full">
                            <Text className="text-on-primary-fixed font-label font-semibold text-sm">
                                📊 Analytics
                            </Text>
                        </View>
                    </View>

                    {/* Soil Moisture Widget */}
                    <View className="bg-surface-container-lowest dark:bg-surface-container-lowest-dark rounded-lg p-4 w-full max-w-xs mb-4">
                        <View className="flex-row items-center gap-3 mb-3">
                            <View className="w-9 h-9 rounded-full bg-secondary-container dark:bg-secondary-container-dark items-center justify-center">
                                <Text className="text-base">💧</Text>
                            </View>
                            <View>
                                <Text className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant dark:text-on-surface-variant-dark">
                                    Soil Moisture
                                </Text>
                                <Text className="font-headline font-black text-xl text-on-surface dark:text-on-surface-dark">
                                    64.2%
                                </Text>
                            </View>
                        </View>
                        <View className="h-1.5 w-full bg-surface-container-high dark:bg-surface-container-high-dark rounded-full overflow-hidden">
                            <View className="h-full bg-secondary rounded-full" style={{ width: "64%" }} />
                        </View>
                    </View>
                </View>
            </GradientHero>

            {/* ── CTA Section ── */}
            <View className="px-8 py-10 bg-surface dark:bg-surface-dark">
                <GradientButton onPress={() => router.push("/(auth)/login")}>
                    <Text className="text-on-primary font-headline font-bold text-lg">Get Started</Text>
                    <Text className="text-on-primary text-lg">→</Text>
                </GradientButton>

                <Pressable
                    onPress={() => router.push("/(auth)/register")}
                    className="bg-surface-container-high dark:bg-surface-container-high-dark py-5 rounded-full items-center active:opacity-80 mb-4"
                >
                    <Text className="text-on-surface dark:text-on-surface-dark font-headline font-bold text-lg">
                        Create Account
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push("/(auth)/guest")}
                    className="border-2 border-primary dark:border-primary-dark py-5 rounded-full items-center active:opacity-80"
                >
                    <Text className="text-primary dark:text-primary-dark font-headline font-bold text-lg">
                        Try as Guest
                    </Text>
                </Pressable>

                <Text className="text-on-surface-variant dark:text-on-surface-variant-dark text-center mt-8 text-sm font-body">
                    Join 2,500+ agricultural innovators using TerraDetect
                </Text>
            </View>

            {/* ── Feature Highlights ── */}
            <View className="bg-surface-container-low dark:bg-surface-container-low-dark px-8 py-10 gap-6">
                <Text className="font-headline font-extrabold text-3xl text-on-surface dark:text-on-surface-dark mb-4">
                    Ecosystem Intelligence
                </Text>
                {[
                    { icon: "🔬", title: "Soil Health Monitoring", desc: "Track nitrogen, phosphorus, potassium and pH in real-time across your entire acreage." },
                    { icon: "📈", title: "Predictive Analytics", desc: "AI forecasts yield outcomes with 94% accuracy using multi-decade weather patterns." },
                    { icon: "🌾", title: "Crop Suitability", desc: "Suggests optimal crop rotation based on soil depletion and market demand." },
                ].map((feature) => (
                    <View key={feature.title} className="flex-row items-start gap-4">
                        <View className="w-14 h-14 rounded-full bg-surface-container-lowest dark:bg-surface-container-lowest-dark items-center justify-center">
                            <Text className="text-2xl">{feature.icon}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="font-headline font-bold text-on-surface dark:text-on-surface-dark text-base mb-1">
                                {feature.title}
                            </Text>
                            <Text className="font-body text-sm text-on-surface-variant dark:text-on-surface-variant-dark leading-5">
                                {feature.desc}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* ── Testimonial ── */}
            <View className="px-8 py-12 items-center bg-surface dark:bg-surface-dark">
                <Text className="text-7xl text-primary-container opacity-20 mb-4">"</Text>
                <Text className="font-headline font-bold text-2xl text-on-surface dark:text-on-surface-dark text-center leading-8 mb-6">
                    "TerraDetect has fundamentally changed how we view our land. It's no longer just dirt — it's a living data engine we can finally understand."
                </Text>
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-primary-fixed items-center justify-center">
                        <Text className="text-lg">👩‍🔬</Text>
                    </View>
                    <View>
                        <Text className="font-headline font-bold text-on-surface dark:text-on-surface-dark text-sm">Dr. Elena Thorne</Text>
                        <Text className="font-label text-[11px] text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-widest">
                            Lead Scientist, BioField
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── Dark CTA Banner ── */}
            <View className="bg-on-surface dark:bg-inverse-surface px-8 py-16 items-center">
                <Text className="font-headline font-black text-4xl text-white text-center mb-4">
                    Ready to grow smarter?
                </Text>
                <Text className="font-body text-white/70 text-center text-base mb-10 max-w-sm leading-6">
                    Join 2,500+ agricultural innovators using TerraDetect to optimize soil health and maximize harvest yields.
                </Text>
                <Pressable
                    onPress={() => router.push("/(auth)/register")}
                    className="bg-white rounded-full px-10 py-4 items-center mb-4 active:opacity-90 w-full max-w-xs"
                >
                    <Text className="text-on-surface font-headline font-black text-lg">Create Free Account</Text>
                </Pressable>
                <Pressable
                    onPress={() => { }}
                    className="rounded-full px-10 py-4 items-center w-full max-w-xs"
                    style={{ borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" }}
                >
                    <Text className="text-white font-headline font-black text-lg">Schedule Demo</Text>
                </Pressable>
            </View>

            {/* ── Footer ── */}
            <View className="bg-surface-container dark:bg-surface-container-dark px-8 py-10">
                <View className="flex-row items-center gap-2 mb-4">
                    <Text className="text-primary dark:text-primary-dark text-xl">🌱</Text>
                    <Text className="font-headline font-black text-on-surface dark:text-on-surface-dark tracking-tight">TerraDetect</Text>
                </View>
                <Text className="font-body text-sm text-on-surface-variant dark:text-on-surface-variant-dark mb-6 leading-5">
                    Advancing the science of soil through data-driven precision and sustainable practices.
                </Text>
                <View className="flex-row gap-10 mb-8">
                    {[
                        { title: "Platform", items: ["Soil Analysis", "Yield Prediction", "API & Integration"] },
                        { title: "Research", items: ["Whitepapers", "Case Studies", "Field Reports"] },
                    ].map((col) => (
                        <View key={col.title} className="flex-1">
                            <Text className="font-headline font-bold text-on-surface dark:text-on-surface-dark mb-3 text-sm">{col.title}</Text>
                            {col.items.map((item) => (
                                <Text key={item} className="text-sm text-on-surface-variant dark:text-on-surface-variant-dark mb-2 font-body">{item}</Text>
                            ))}
                        </View>
                    ))}
                </View>
                <View style={{ height: 1, backgroundColor: "rgba(25,28,29,0.06)" }} className="mb-4" />
                <Text className="font-label text-[11px] text-on-surface-variant dark:text-on-surface-variant-dark uppercase tracking-widest text-center">
                    © 2024 TerraDetect Systems · All Rights Reserved
                </Text>
            </View>
        </ScrollView>
    );
}
