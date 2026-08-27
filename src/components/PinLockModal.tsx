import React, { useState } from 'react';
import { Lock, KeyRound, X } from 'lucide-react';
import { verifyPin, updatePin } from '../utils/security';

interface PinLockModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'change';
  onUnlockSuccess: () => void;
  onCloseChangeModal?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  mode,
  onUnlockSuccess,
  onCloseChangeModal,
}) => {
  const [pin, setPin] = useState<string>('');
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        handleVerify(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  const handleVerify = async (enteredPin: string) => {
    const res = await verifyPin(enteredPin);
    if (res.success) {
      setPin('');
      setErrorMsg('');
      onUnlockSuccess();
    } else {
      setPin('');
      if (res.isLockedOut) {
        setIsLockedOut(true);
        setErrorMsg('Too many failed attempts. Portal locked.');
      } else {
        setErrorMsg(`Incorrect PIN. ${res.remainingAttempts} attempts remaining.`);
      }
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN entries do not match.');
      return;
    }

    const res = await updatePin(oldPin, newPin);
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (onCloseChangeModal) onCloseChangeModal();
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-center">
        {mode === 'change' && onCloseChangeModal && (
          <button
            onClick={onCloseChangeModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {mode === 'unlock' ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand-soft-dark text-brand-blue flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-lg text-slate-900 font-display">
              Portal Locked
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Enter clinical 4-digit security PIN to access records (Default: 1397).
            </p>

            {/* PIN Dots */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > idx
                      ? 'bg-brand-navy border-brand-navy scale-110'
                      : 'border-slate-300 bg-slate-100'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-600 font-semibold mb-4 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {errorMsg}
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={isLockedOut}
                  onClick={() => {
                    if (k === 'C') setPin('');
                    else if (k === '⌫') handleBackspace();
                    else handleDigitClick(k);
                  }}
                  className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition active:scale-95 disabled:opacity-50"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePin} className="text-left space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand-soft-dark text-brand-blue flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 font-display">Change Security PIN</h3>
              <p className="text-xs text-slate-500 mt-0.5">Set a new 4-digit PIN for session authorization.</p>
            </div>

            {errorMsg && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{errorMsg}</div>}
            {successMsg && <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">{successMsg}</div>}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Current PIN</label>
              <input
                type="password"
                maxLength={4}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-center text-sm font-mono tracking-widest outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="••••"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-center text-sm font-mono tracking-widest outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="••••"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-center text-sm font-mono tracking-widest outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-navy hover:bg-brand-navy-dark text-white py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              Update PIN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
