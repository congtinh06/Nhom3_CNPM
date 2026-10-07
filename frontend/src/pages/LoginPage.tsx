import React from 'react';
import { AuthModal } from '../components/auth/AuthModal';

export const LoginPage: React.FC = () => {
  return <AuthModal initialView="login" isStandalone />;
};

export default LoginPage;
