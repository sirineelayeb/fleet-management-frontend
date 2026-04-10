import React, { useEffect, useRef, useCallback } from 'react';
import GoogleAuthService from '../../services/googleAuthService';

const GoogleLoginButton = ({ onSuccess, onError, isLoading }) => {
  const buttonRef = useRef(null);
  const initialized = useRef(false);

  const initAndRender = useCallback(async () => {
    if (initialized.current || isLoading) return;
    try {
      await GoogleAuthService.initGoogleClient();
      if (buttonRef.current) {
        GoogleAuthService.renderGoogleButton('google-signin-btn', onSuccess, onError);
        initialized.current = true;
      }
    } catch (err) {
      onError?.('Google Sign-In failed to initialize.');
    }
  }, [isLoading, onSuccess, onError]);

  useEffect(() => {
    initialized.current = false; // reset on prop changes
    initAndRender();
  }, [initAndRender]);

  return (
    <div className="mt-5">
      {/* Divider */}
      <div className="relative flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase whitespace-nowrap">
          Or continue with
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google Button Container */}
      <div
        id="google-signin-btn"
        ref={buttonRef}
        className="flex justify-center min-h-[44px]"
        aria-label="Sign in with Google"
      />

      {isLoading && (
        <div className="flex justify-center mt-2">
          <span className="text-xs text-gray-400 animate-pulse">Connecting to Google…</span>
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
