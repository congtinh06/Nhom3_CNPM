import React from 'react';
import { AuthModal } from '../components/auth/AuthModal';

export const ForgotPasswordPage: React.FC = () => {
  return <AuthModal initialView="forgot" isStandalone />;
};

export default ForgotPasswordPage;
