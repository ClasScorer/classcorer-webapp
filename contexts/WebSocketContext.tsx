'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

type WebSocketContextType = {
  sendMessage: (message: string | ArrayBuffer) => void;
  sendImageToAPI: (imageData: string, lectureId: string) => Promise<any>;
  isConnected: boolean;
  lastMessage: any | null;
};

const WebSocketContext = createContext<WebSocketContextType>({
  sendMessage: () => {},
  sendImageToAPI: async () => null,
  isConnected: false,
  lastMessage: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

type WebSocketProviderProps = {
  children: ReactNode;
  onMessage?: (message: any) => void;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, onMessage }) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  // Handle WebSocket setup
  useEffect(() => {
    // Connect to WebSocket server if available
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = (message) => {
        // Process message 
        try {
          const data = JSON.parse(message.data);
          // Handle custom message callback if provided
          if (onMessage) {
            onMessage(data);
          }
          
          // Also store the message in the context
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      // Clean up WebSocket connection on unmount
      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, [onMessage]);

  // Function to send message via WebSocket
  const sendMessage = (message: string | ArrayBuffer) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn('WebSocket is not connected, using HTTP fallback');
    }
  };

  // Function to send image data to the API via HTTP (fallback or primary method)
  const sendImageToAPI = async (imageData: string, lectureId: string) => {
    try {
      // Convert base64 image to blob
      const base64Response = await fetch(imageData);
      const imageBlob = await base64Response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('image', imageBlob, 'frame.jpg');
      formData.append('lectureId', lectureId);
      formData.append('timestamp', new Date().toISOString());
      
      // Send to API
      const apiUrl = '/api/process-frame';
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the response
      if (onMessage) {
        onMessage(data);
      }
      
      setLastMessage(data);
      return data;
    } catch (error) {
      console.error('Error sending image to API:', error);
      return null;
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, sendImageToAPI, isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};