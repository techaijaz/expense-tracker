import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import {
  setOnboardingDone,
  updatePreferences,
  setAuthUser,
} from '@/redux/authSlice';
import { setAccounts } from '@/redux/accountSlice';

import StepWelcome from './StepWelcome';
import StepPreferences from './StepPreferences';
import StepAccount from './StepAccount';
import StepTrial from './StepTrial';

const Onboarding = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Consolidated Onboarding Data
  const [onboardingData, setOnboardingData] = useState({
    language: 'en',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    decimalPlaces: 2,
    theme: 'dark',
    accentColor: 'lightblue',
    fiscalYear: 'April – March',
    account: {
      type: 'Bank Account',
      name: '',
      lastDigits: '',
      balance: '0',
    },
    activateTrial: false,
  });

  useEffect(() => {
    document.title = 'aiexpenser | Onboarding';
    // If onboarding is already done, redirect to dashboard
    if (user?.onboardingDone) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const updateData = (newData) => {
    setOnboardingData((prev) => ({ ...prev, ...newData }));

    // Sync language if updated
    if (newData.language) {
      i18n.changeLanguage(newData.language);
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleComplete = async (activateTrialOverride = null) => {
    setIsLoading(true);
    const isTrialRequested = activateTrialOverride !== null ? activateTrialOverride : onboardingData.activateTrial;
    
    try {
      // Map Fiscal Year string to backend enum
      const fiscalYearMap = {
        'April – March': 'APR-MAR',
        'January – December': 'JAN-DEC',
      };

      // Map Account Type to backend enum
      const typeMap = {
        'Bank Account': 'BANK',
        'Credit Card': 'CREDIT_CARD',
        Investment: 'INVESTMENT',
        'E-Wallet': 'WALLET',
      };

      const payload = {
        preferences: {
          language: onboardingData.language,
          currency: onboardingData.currency,
          dateFormat: onboardingData.dateFormat,
          decimalPlaces: onboardingData.decimalPlaces,
          theme: onboardingData.theme,
          accentColor: onboardingData.accentColor || 'lightblue',
          fiscalYear: fiscalYearMap[onboardingData.fiscalYear] || 'APR-MAR',
        },
        account: onboardingData.account.name
          ? {
              type: typeMap[onboardingData.account.type] || 'BANK',
              name: onboardingData.account.name,
              accountNumber: onboardingData.account.lastDigits,
              balance: parseFloat(onboardingData.account.balance) || 0,
            }
          : null,
        activateTrial: isTrialRequested,
      };

      const response = await api.post('/onboarding/complete', payload);

      if (response.success) {
        // Update Redux state
        dispatch(setOnboardingDone(true));
        dispatch(updatePreferences(payload.preferences));

        if (isTrialRequested) {
          // Explicitly refresh from server to get accurate plan/dates
          const selfResponse = await api.get('/user/self-identification');
          if (selfResponse.success) {
            dispatch(setAuthUser(selfResponse.data));
          }
        }

        toast.success('Workspace ready! Welcome to aiexpenser.');

        // Final Redirection
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        toast.error(response.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding finalize error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/onboarding/skip');
      if (response.success) {
        dispatch(setOnboardingDone(true));
        toast.info('Onboarding skipped. System defaults applied.');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to skip onboarding.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-body relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[radial-gradient(circle,var(--accent-glow)_0%,transparent_70%)] pointer-events-none"></div>

      <style>{`
        .onboard-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
        }
        .prog-step { height: 3px; border-radius: 2px; flex: 1; background: var(--bg4); }
        .prog-step.done { background: var(--accent); }
        .prog-step.active { background: var(--accent); opacity: 0.6; }
      `}</style>

      {/* Steps Rendering */}
      <div className="w-full max-w-[520px] z-10">
        {step === 1 && <StepWelcome onNext={handleNext} />}
        {step === 2 && (
          <StepPreferences
            data={onboardingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <StepAccount
            data={onboardingData}
            updateData={updateData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        )}
        {step === 4 && (
          <StepTrial
            data={onboardingData}
            updateData={updateData}
            onComplete={handleComplete}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
