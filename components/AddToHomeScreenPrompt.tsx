import React, { useState, useEffect } from 'react';

const isIOS = () => {
  // Simple check for iOS devices (iPhone, iPad, iPod)
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isInStandaloneMode = () => {
  // Checks if the app is running in standalone mode (i.e., added to home screen)
  if (typeof window === 'undefined') return false;
  return ('standalone' in window.navigator) && ((window.navigator as any).standalone === true);
};

const isNative = () => {
  // Checks if the app is running in a native Capacitor container
  return typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
}

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mx-1 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const AddToHomeScreenPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show the prompt only if it's an iOS device, not in standalone mode,
    // and the user hasn't dismissed it before in this session.
    const hasDismissed = sessionStorage.getItem('dismissedA2HSPrompt');
    if (isIOS() && !isInStandaloneMode() && !hasDismissed && !isNative()) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('dismissedA2HSPrompt', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="a2hs-prompt">
      <button onClick={handleDismiss} className="a2hs-close-btn" aria-label="Close">
        &times;
      </button>
      <p className="a2hs-text">
        To get the full app experience, add this to your Home Screen. Tap the 
        <ShareIcon /> 
        icon and then 'Add to Home Screen'.
      </p>
    </div>
  );
};

export default AddToHomeScreenPrompt;