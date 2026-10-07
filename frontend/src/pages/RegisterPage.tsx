import React from 'react';
import { AuthModal } from '../components/auth/AuthModal';

export const RegisterPage: React.FC = () => {
  return <AuthModal initialView="register" isStandalone />;
};

export default RegisterPage;
