import { Check } from 'lucide-react';

export interface StepperProps {
  currentStep: 1 | 2 | 3;
  allCompleted?: boolean;
}

export function Stepper({ currentStep, allCompleted = false }: StepperProps) {
  const isStep1Completed = allCompleted || currentStep > 1;
  const isStep2Completed = allCompleted || currentStep > 2;
  const isStep3Completed = allCompleted;

  return (
    <nav className="checkout-stepper" aria-label="Tiến trình thanh toán">
      {/* Step 1: Giỏ hàng */}
      <div className="stepper-step">
        <div
          className={`stepper-circle ${
            isStep1Completed ? 'completed' : currentStep === 1 ? 'active' : ''
          }`}
          title={isStep1Completed ? 'Đã hoàn thành' : undefined}
        >
          {isStep1Completed ? (
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <span>1</span>
          )}
        </div>
        <span
          className={`stepper-label ${
            isStep1Completed ? 'completed' : currentStep === 1 ? 'active' : ''
          }`}
        >
          Giỏ hàng
        </span>
      </div>

      {/* Connecting Line 1-2 */}
      <div
        className={`stepper-line ${
          allCompleted || currentStep >= 2 ? 'completed' : ''
        }`}
        aria-hidden="true"
      />

      {/* Step 2: Thanh toán */}
      <div className="stepper-step">
        <div
          className={`stepper-circle ${
            isStep2Completed ? 'completed' : currentStep === 2 ? 'active' : ''
          }`}
          aria-current={!allCompleted && currentStep === 2 ? 'step' : undefined}
          title={isStep2Completed ? 'Đã hoàn thành' : undefined}
        >
          {isStep2Completed ? (
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <span>2</span>
          )}
        </div>
        <span
          className={`stepper-label ${
            isStep2Completed ? 'completed' : currentStep === 2 ? 'active' : ''
          }`}
        >
          Thanh toán
        </span>
      </div>

      {/* Connecting Line 2-3 */}
      <div
        className={`stepper-line ${
          allCompleted || currentStep >= 3 ? 'completed' : ''
        }`}
        aria-hidden="true"
      />

      {/* Step 3: Hoàn tất */}
      <div className="stepper-step">
        <div
          className={`stepper-circle ${
            isStep3Completed ? 'completed' : currentStep === 3 ? 'active' : ''
          }`}
          aria-current={currentStep === 3 && !allCompleted ? 'step' : undefined}
          title={isStep3Completed ? 'Đã hoàn thành' : undefined}
        >
          {isStep3Completed ? (
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <span>3</span>
          )}
        </div>
        <span
          className={`stepper-label ${
            isStep3Completed ? 'completed' : currentStep === 3 ? 'active' : ''
          }`}
        >
          Hoàn tất
        </span>
      </div>
    </nav>
  );
}

export default Stepper;
