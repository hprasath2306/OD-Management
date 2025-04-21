import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import Constants from "expo-constants";

import { Platform } from "react-native";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
  error?: string;
}

export const usePushNotifications = (): PushNotificationState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowAlert: true,
      shouldSetBadge: false,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();

  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();

  const [error, setError] = useState<string | undefined>();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    
    // Set up Android notification channel
    if (Platform.OS === "android") {
      try {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      } catch (err) {
        console.log("Error setting up notification channel:", err);
      }
    }

    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== "granted") {
          setError("Permission not granted for push notifications");
          console.log("Push notification permission not granted");
          return;
        }

        // Try to get project ID from Constants
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (!projectId) {
          setError("Project ID not found. Make sure it's set in your app.json");
          console.log("Project ID not found for push notifications");
          return;
        }
        
        console.log("Getting push token with project ID:", projectId);
        
        try {
          token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          console.log("Push token generated successfully:", token);
        } catch (tokenError: any) {
          // FCM initialization error
          if (tokenError.message?.includes("FirebaseApp is not initialized")) {
            setError("FCM not properly configured. Push notifications will not work until Firebase is set up.");
            console.log("FCM not initialized error:", tokenError.message);
            // Don't throw an error, just log it and continue
          } else {
            setError(`Error getting push token: ${tokenError.message}`);
            console.log("Error getting push token:", tokenError);
          }
        }
      } catch (err) {
        setError(`General push notification error: ${err}`);
        console.log("Push notification setup error:", err);
      }
    } else {
      setError("Push notifications require a physical device");
      console.log("Must use physical device for Push notifications");
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    error
  };
};