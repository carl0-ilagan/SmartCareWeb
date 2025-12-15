"use client"

import { Phone, Video } from 'lucide-react';
import { useCall } from '@/contexts/call-context';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

export default function Chat({ conversation, messages, onSendMessage }) {
  const { initiateCall } = useCall();
  const { user } = useAuth();
  const router = useRouter();
  const [isCalling, setIsCalling] = useState(false);

  const handleStartCall = async (type) => {
    try {
      setIsCalling(true);
      
      // Determine the receiver ID based on user role
      const receiverId = user.role === 'patient' ? conversation.doctorId : conversation.patientId;
      
      if (!receiverId) {
        throw new Error('Receiver ID not found');
      }

      const callId = await initiateCall(receiverId, type);
      
      // Navigate to the appropriate call page based on user role
      if (user.role === 'patient') {
        router.push(`/dashboard/calls/${type}/${callId}`);
      } else {
        router.push(`/doctor/calls/${type}/${callId}`);
      }
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not start call. Please try again.');
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200">
            {conversation.doctorPhotoURL ? (
              <img
                src={conversation.doctorPhotoURL}
                alt={conversation.doctorName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {conversation.doctorName?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{conversation.doctorName}</h3>
            <p className="text-sm text-gray-500">{conversation.doctorSpecialty}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleStartCall('voice')}
            disabled={isCalling}
            className={`p-2 rounded-full ${
              isCalling 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-soft-amber hover:bg-deep-amber'
            } text-white transition-colors`}
            title="Voice Call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => handleStartCall('video')}
            disabled={isCalling}
            className={`p-2 rounded-full ${
              isCalling 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-soft-amber hover:bg-deep-amber'
            } text-white transition-colors`}
            title="Video Call"
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Rest of the chat component ... */}
    </div>
  );
} 