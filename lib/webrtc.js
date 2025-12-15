import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

// WebRTC configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// Create a new call document
export const createCall = async (callerId, receiverId, type, conversationId) => {
  try {
    const callRef = await addDoc(collection(db, 'calls'), {
      callerId,
      receiverId,
      type,
      conversationId,
      status: 'calling',
      createdAt: serverTimestamp(),
      offer: null,
      answer: null,
    });

    return callRef.id;
  } catch (error) {
    console.error('Error creating call:', error);
    return null;
  }
};

// Initialize WebRTC peer connection
export const initializePeerConnection = () => {
  return new RTCPeerConnection(configuration);
};

// Create and set local description (offer)
export const createOffer = async (peerConnection) => {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error('Error creating offer:', error);
    return null;
  }
};

// Handle incoming offer
export const handleOffer = async (peerConnection, offer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error('Error handling offer:', error);
    return null;
  }
};

// Handle incoming answer
export const handleAnswer = async (peerConnection, answer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error handling answer:', error);
  }
};

// Collect ICE candidates
export const collectIceCandidates = (callId, peerConnection, localId, remoteId) => {
  const candidatesCollection = collection(db, 'calls', callId, 'candidates');

  // Listen for local ICE candidates
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(candidatesCollection, {
        candidate: event.candidate.toJSON(),
        from: localId,
        timestamp: serverTimestamp(),
      });
    }
  };

  // Listen for remote ICE candidates
  const unsubscribe = onSnapshot(candidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data.from === remoteId) {
          const candidate = new RTCIceCandidate(data.candidate);
          peerConnection.addIceCandidate(candidate).catch(console.error);
        }
      }
    });
  });

  return unsubscribe;
};

// End call
export const endCall = async (callId) => {
  try {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error ending call:', error);
  }
};

// Get call stats
export const getCallStats = async (peerConnection) => {
  try {
    const stats = await peerConnection.getStats();
    let result = {};
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        result.videoBitrate = report.bytesReceived;
        result.videoPacketsLost = report.packetsLost;
      }
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        result.audioBitrate = report.bytesReceived;
        result.audioPacketsLost = report.packetsLost;
      }
    });
    return result;
  } catch (error) {
    console.error('Error getting call stats:', error);
    return null;
  }
}; 