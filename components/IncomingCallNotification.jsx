import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Phone, PhoneOff } from 'lucide-react';

export default function IncomingCallNotification({ caller, onAccept, onReject }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Play ringtone
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl ${isAnimating ? 'animate-bounce-slow' : ''}`}>
        {/* Ringtone */}
        <audio ref={audioRef} src="/sounds/ringtone.mp3" loop />
        
        {/* Caller Info */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full">
            <Image
              src={caller.photoURL || '/images/default-avatar.png'}
              alt={caller.displayName}
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{caller.displayName}</h2>
          <p className="text-sm text-gray-500">Incoming Video Call</p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onAccept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
          >
            <Phone className="h-6 w-6" />
          </button>
          <button
            onClick={onReject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
} 