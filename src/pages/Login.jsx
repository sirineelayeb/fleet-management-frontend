import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import ForgotPasswordModal from '../components/Auth/ForgotPasswordModal';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

import fleetImage from '/src/assets/fleet-login.jpg';

const getRoleRoute = (role) => {
  switch (role) {
    case 'admin': return '/dashboard';
    case 'shipment_manager': return '/shipment_manager';
    default: return '/dashboard';
  }
};

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address.';

const validatePassword = (pw) =>
  pw.length >= 6 ? '' : 'Password must be at least 6 characters.';

const Field = ({ label, id, error, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      {children}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Input = ({ id, type, value, onChange, onBlur, placeholder, error, autoComplete }) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    autoComplete={autoComplete}
    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
      ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
    required
  />
);

const PasswordInput = ({ id, value, onChange, onBlur, error, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <LockClosedIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="••••••••"
        autoComplete={autoComplete}
        className={`w-full pl-10 pr-12 py-2.5 border rounded-xl text-sm transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
        required
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
};

const SubmitButton = ({ loading, label, loadingLabel }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full bg-teal-600 text-white py-2.5 rounded-xl
               font-semibold text-sm hover:bg-teal-700 
               active:scale-[0.98] transition-all duration-200
               disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-200"
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {loadingLabel}
      </span>
    ) : label}
  </button>
);

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
      active
        ? 'bg-teal-600 text-white shadow-sm'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState('login');
  const [sharedEmail, setSharedEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });

  const patchLogin = (key) => (e) => {
    const val = e.target.value;
    setLoginData((p) => ({ ...p, [key]: val }));
    if (loginErrors[key]) setLoginErrors((p) => ({ ...p, [key]: '' }));
    if (key === 'email') setSharedEmail(val);
  };

  const blurLogin = (key) => () => {
    if (key === 'email') setLoginErrors((p) => ({ ...p, email: validateEmail(loginData.email) }));
    if (key === 'password') setLoginErrors((p) => ({ ...p, password: validatePassword(loginData.password) }));
  };

  const [regData, setRegData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [regErrors, setRegErrors] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });

  const patchReg = (key) => (e) => {
    const val = e.target.value;
    setRegData((p) => ({ ...p, [key]: val }));
    if (regErrors[key]) setRegErrors((p) => ({ ...p, [key]: '' }));
    if (key === 'email') setSharedEmail(val);
  };

  const blurReg = (key) => () => {
    if (key === 'name' && !regData.name.trim())
      setRegErrors((p) => ({ ...p, name: 'Name is required.' }));
    if (key === 'email')
      setRegErrors((p) => ({ ...p, email: validateEmail(regData.email) }));
    if (key === 'password')
      setRegErrors((p) => ({ ...p, password: validatePassword(regData.password) }));
    if (key === 'confirmPassword' && regData.confirmPassword !== regData.password)
      setRegErrors((p) => ({ ...p, confirmPassword: 'Passwords do not match.' }));
  };

  const switchTab = useCallback((t) => {
    setTab(t);
    if (t === 'register') setRegData((p) => ({ ...p, email: sharedEmail }));
    if (t === 'login') setLoginData((p) => ({ ...p, email: sharedEmail }));
  }, [sharedEmail]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(loginData.email);
    const pwErr = validatePassword(loginData.password);
    if (emailErr || pwErr) {
      setLoginErrors({ email: emailErr, password: pwErr });
      return;
    }
    setLoginLoading(true);
    try {
      const result = await login(loginData.email, loginData.password);
      if (result?.success) {
        navigate(getRoleRoute(result.user?.role));
      } else {
        toast.error(result?.message || 'Incorrect email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const nameErr = regData.name.trim() ? '' : 'Name is required.';
    const emailErr = validateEmail(regData.email);
    const pwErr = validatePassword(regData.password);
    const cpwErr = regData.password !== regData.confirmPassword ? 'Passwords do not match.' : '';
    if (nameErr || emailErr || pwErr || cpwErr) {
      setRegErrors({ name: nameErr, email: emailErr, password: pwErr, confirmPassword: cpwErr });
      return;
    }
    setRegisterLoading(true);
    try {
      const result = await authService.register({
        name: regData.name,
        email: regData.email,
        password: regData.password,
        role: 'shipment_manager',
      });
      if (result.success) {
        toast.success('Account created! You can now sign in.');
        setRegData({ name: '', email: '', password: '', confirmPassword: '' });
        setRegErrors({ name: '', email: '', password: '', confirmPassword: '' });
        switchTab('login');
      } else {
        toast.error(result.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Register error:', err);
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left side: Image – hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex lg:w-2/5 relative bg-gray-900 min-h-screen">
          <img src={fleetImage} alt="Fleet management" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/70 to-white-800/50 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Fleet Manager</h2>
            <p className="text-lg text-gray-200 max-w-md">
              Streamline your logistics, track shipments, and manage your entire fleet from one platform.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-3/5 bg-white-500 flex flex-col">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="px-8 py-12 sm:px-14 sm:py-16 h-full flex flex-col">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {tab === 'login' ? 'Welcome back' : 'Create an account'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {tab === 'login'
                      ? 'Sign in to manage your fleet'
                      : 'Join Fleet Manager to get started'}
                  </p>
                </div>

                <div className="flex bg-gray-200 rounded-xl p-1 mb-8">
                  <TabButton active={tab === 'login'} onClick={() => switchTab('login')} label="Sign in" />
                  <TabButton active={tab === 'register'} onClick={() => switchTab('register')} label="Create account" />
                </div>

                {tab === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    <Field label="Email address" id="login-email" error={loginErrors.email} icon={EnvelopeIcon}>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={patchLogin('email')}
                        onBlur={blurLogin('email')}
                        placeholder="name@fleetmanager.com"
                        autoComplete="email"
                        error={loginErrors.email}
                      />
                    </Field>

                    <Field label="Password" id="login-password" error={loginErrors.password}>
                      <PasswordInput
                        id="login-password"
                        value={loginData.password}
                        onChange={patchLogin('password')}
                        onBlur={blurLogin('password')}
                        error={loginErrors.password}
                        autoComplete="current-password"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </Field>

                    <SubmitButton loading={loginLoading} label="Sign in" loadingLabel="Signing in..." />
                  </form>
                )}

                {tab === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    <Field label="Full name" id="reg-name" error={regErrors.name} icon={UserIcon}>
                      <Input
                        id="reg-name"
                        type="text"
                        value={regData.name}
                        onChange={patchReg('name')}
                        onBlur={blurReg('name')}
                        placeholder="Full name"
                        autoComplete="name"
                        error={regErrors.name}
                      />
                    </Field>

                    <Field label="Email address" id="reg-email" error={regErrors.email} icon={EnvelopeIcon}>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regData.email}
                        onChange={patchReg('email')}
                        onBlur={blurReg('email')}
                        placeholder="name@fleetmanager.com"
                        autoComplete="email"
                        error={regErrors.email}
                      />
                    </Field>

                    <Field label="Password" id="reg-password" error={regErrors.password}>
                      <PasswordInput
                        id="reg-password"
                        value={regData.password}
                        onChange={patchReg('password')}
                        onBlur={blurReg('password')}
                        error={regErrors.password}
                        autoComplete="new-password"
                      />
                    </Field>

                    <Field label="Confirm password" id="reg-confirm" error={regErrors.confirmPassword}>
                      <PasswordInput
                        id="reg-confirm"
                        value={regData.confirmPassword}
                        onChange={patchReg('confirmPassword')}
                        onBlur={blurReg('confirmPassword')}
                        error={regErrors.confirmPassword}
                        autoComplete="new-password"
                      />
                    </Field>

                    <SubmitButton loading={registerLoading} label="Create account" loadingLabel="Creating account..." />
                  </form>
                )}

                <p className="text-center text-xs text-gray-400 mt-6 pt-2 border-t border-gray-200">
                  © {new Date().getFullYear()} Fleet Manager. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
};

export default Login;