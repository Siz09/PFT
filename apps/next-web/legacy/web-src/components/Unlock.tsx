import { useEffect, useRef, useState } from 'react';
import { Fingerprint, Delete } from 'lucide-react';

interface UnlockProps {
  onUnlock: () => void;
}

export default function Unlock({ onUnlock }: UnlockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current !== null) {
        clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const handlePress = (num: string) => {
    if (pin.length >= 4) return;
    if (error) setError(null);
    const newPin = pin + num;
    setPin(newPin);
    if (newPin.length !== 4) return;

    void (async () => {
      try {
        const r = await fetch('/api/validate-unlock-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: newPin }),
        });
        if (!r.ok) {
          setPin('');
          setError('PIN validation failed. Try again.');
          return;
        }
        const data = (await r.json()) as { ok?: boolean };
        if (data.ok) {
          if (unlockTimerRef.current !== null) clearTimeout(unlockTimerRef.current);
          unlockTimerRef.current = setTimeout(() => {
            onUnlock();
            unlockTimerRef.current = null;
          }, 200);
        } else {
          setPin('');
          setError('Incorrect PIN');
        }
      } catch {
        setPin('');
        setError('Unable to validate PIN right now. Check connection and retry.');
      }
    })();
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleForgotPin = () => {
    window.alert('PIN recovery is not configured yet. Disable biometric lock from device settings if you are locked out.');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-12 mb-16">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <Fingerprint size={40} className="text-black" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Enter PIN</h1>
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pin.length > i ? 'bg-black border-black' : 'border-gray-100'
                }`}
              />
            ))}
          </div>
          {error ? <p className="text-sm font-semibold text-rose-500">{error}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handlePress(num)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold hover:bg-gray-50 active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handlePress('0')}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold hover:bg-gray-50 active:scale-90 transition-all"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="w-16 h-16 rounded-full flex items-center justify-center text-gray-400 hover:text-black active:scale-90 transition-all"
        >
          <Delete size={24} />
        </button>
      </div>

      <button
        type="button"
        onClick={handleForgotPin}
        className="mt-16 text-sm font-bold text-gray-400 hover:text-black transition-colors"
      >
        Forgot PIN?
      </button>
    </div>
  );
}
