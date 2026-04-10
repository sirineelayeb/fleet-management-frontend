import { jwtDecode } from 'jwt-decode';
import api from './api';

class GoogleAuthService {
  // Initialize Google OAuth
  static initGoogleClient() {
    return new Promise((resolve) => {
      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      document.body.appendChild(script);
    });
  }

  // Handle Google Login
  static async handleGoogleLogin(credentialResponse) {
    try {
      // Decode the JWT token
      const decoded = jwtDecode(credentialResponse.credential);
      console.log('Google user:', decoded);
      
      // Send to backend for verification/registration
      const response = await api.post('/auth/google', {
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        picture: decoded.picture
      });
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user
      };
    } catch (error) {
      console.error('Google login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Google login failed'
      };
    }
  }

  // Render Google Login Button
  static renderGoogleButton(containerId, onSuccess, onError) {
    window.google?.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const result = await this.handleGoogleLogin(response);
        if (result.success) {
          onSuccess(result);
        } else {
          onError(result.message);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google?.accounts.id.renderButton(
      document.getElementById(containerId),
      {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: '100%'
      }
    );
  }
}

export default GoogleAuthService;
