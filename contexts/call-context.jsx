"use client"

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
import { createCall } from '@/lib/call-service';

const CallContext = createContext();

export function CallProvider({ children }) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Listen for incoming calls
    const unsubscribe = onSnapshot(doc(db, "activeCall", user.uid), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const callData = docSnapshot.data();

        // Only process if this is an incoming call (not initiated by the current user)
        if (callData.initiator !== user.uid) {
          setIncomingCall(callData);
          setCallerInfo(callData.initiatorInfo);
        }
      } else {
        // No active call, clear state
        setIncomingCall(null);
        setCallerInfo(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const initiateCall = async (receiverId, type) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create a new call
      const callId = await createCall(user.uid, receiverId, type, {
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
      });

      if (!callId) {
        throw new Error('Failed to create call');
      }

      setActiveCall(callId);
      return callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  };

  const answerCall = async (callId) => {
    try {
      await updateDoc(doc(db, "calls", callId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      setIncomingCall(null);
      setActiveCall(callId);
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  };

  const rejectCall = async (callId) => {
    try {
      await updateDoc(doc(db, "calls", callId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      // Remove active call reference
      await setDoc(doc(db, "activeCall", user.uid), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      setIncomingCall(null);
      setCallerInfo(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
      throw error;
    }
  };

  const endActiveCall = async () => {
    if (activeCall) {
      try {
        await updateDoc(doc(db, "calls", activeCall), {
          status: "ended",
          endedAt: serverTimestamp(),
        });

        // Remove active call reference
        await setDoc(doc(db, "activeCall", user.uid), {
          status: "ended",
          endedAt: serverTimestamp(),
        });

        setActiveCall(null);
      } catch (error) {
        console.error('Error ending call:', error);
        throw error;
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        callerInfo,
        initiateCall,
        answerCall,
        rejectCall,
        endActiveCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
