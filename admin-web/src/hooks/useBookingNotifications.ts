import { useState, useEffect, useCallback } from 'react';

// Play a notification sound using Web Audio API
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 200);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
}

// Hook for booking notifications with sound
export function useBookingNotifications(onNewBooking?: () => void) {
  const [pendingCount, setPendingCount] = useState(0);

  const handleNewBooking = useCallback(() => {
    playNotificationSound();
    setPendingCount((prev) => prev + 1);
    if (onNewBooking) {
      onNewBooking();
    }
  }, [onNewBooking]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const wsUrl = `${protocol}//${hostname}:45357/monitoring`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected for booking notifications');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'new_booking') {
              handleNewBooking();
            }
          } catch (e) {
            // Ignore parse errors
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, reconnecting in 5 seconds...');
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (e) {
        console.error('Failed to connect WebSocket:', e);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [handleNewBooking]);

  const resetCount = useCallback(() => {
    setPendingCount(0);
  }, []);

  return { pendingCount, resetCount };
}
