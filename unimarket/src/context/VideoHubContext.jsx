// src/context/VideoHubContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { AuthContext } from "./AuthContext";

export const VideoHubContext = createContext(null);

export const useVideoHub = () => {
  return useContext(VideoHubContext);
};

export const VideoHubProvider = ({ children }) => {
  const [videoConnection, setVideoConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useContext(AuthContext);
  const connectionRef = useRef(null);
  const API_BASE = "http://localhost:5133"; // ✅ Base URL backend của bạn

  useEffect(() => {
    if (!token) {
      // Nếu không có token (logout)
      if (connectionRef.current) {
        connectionRef.current
          .stop()
          .then(() => console.log("❌ SignalR (VideoHub) Disconnected (Logout)."))
          .catch((err) => console.error("Error stopping connection:", err));
      }
      connectionRef.current = null;
      setVideoConnection(null);
      setIsConnected(false);
      return;
    }

    // Nếu đã có token và chưa có connection đang hoạt động
    if (connectionRef.current) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/videoHub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = newConnection;

    const startConnection = async () => {
      try {
        await newConnection.start();
        console.log("✅ VideoHub Connected!");
        setVideoConnection(newConnection);
        setIsConnected(true);
      } catch (err) {
        console.error("❌ VideoHub Connection Failed: ", err);
        setIsConnected(false);
        // Thử kết nối lại sau 5s nếu fail
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    // Sự kiện Reconnect / Close
    newConnection.onreconnecting((error) => {
      console.warn(`⚠️ VideoHub Reconnecting: ${error}`);
      setIsConnected(false);
    });

    newConnection.onreconnected((connectionId) => {
      console.log(`✅ VideoHub Reconnected: ${connectionId}`);
      setIsConnected(true);
    });

    newConnection.onclose((error) => {
      console.error(`❌ VideoHub Closed: ${error}`);
      setIsConnected(false);
      connectionRef.current = null;
    });

    // Cleanup khi unmount hoặc token đổi
    return () => {
      if (connectionRef.current) {
        connectionRef.current
          .stop()
          .then(() =>
            console.log("❌ SignalR (VideoHub) Disconnected (Cleanup).")
          )
          .catch((err) => console.error("Error stopping VideoHub:", err));
      }
      connectionRef.current = null;
      setVideoConnection(null);
      setIsConnected(false);
    };
  }, [token]);

  const value = {
    videoConnection,
    isConnected,
  };

  return (
    <VideoHubContext.Provider value={value}>
      {children}
    </VideoHubContext.Provider>
  );
};
