import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import LandingScreen from "./screens/LandingScreen";
import MainScreen from "./screens/MainScreen";
import MyTreeScreen from "./screens/MyTreeScreen";
import AboutScreen from "./screens/AboutScreen";

const Stack = createNativeStackNavigator();

const MobileApp = () => (
  <>
    <StatusBar style="light" />
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={({ route }) => ({
          headerShown: false,
          animation: route?.params?.tabSwitch ? "none" : "slide_from_right",
        })}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="MyTree" component={MyTreeScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </>
);

export default MobileApp;
