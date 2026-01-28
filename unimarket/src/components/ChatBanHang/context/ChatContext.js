import { createContext, useContext } from "react";

// 1. Tạo Context
export const ChatContext = createContext(null);

// 2. Tạo hook tuỳ chỉnh (useChat)
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat phải được dùng bên trong ChatProvider (ChatBox)");
  }
  return context;
};