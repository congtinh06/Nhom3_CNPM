import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Volume2, Square, RotateCcw } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';

export interface StepItem {
  title: string;
  speechText: string;
  content: React.ReactNode;
}

interface StepCarouselProps {
  steps: StepItem[];
  stepIndicatorText: (current: number, total: number) => string;
  prevBtnText: string;
  nextBtnText: string;
  langCode: string;
}

export const StepCarousel: React.FC<StepCarouselProps> = ({
  steps,
  stepIndicatorText,
  prevBtnText,
  nextBtnText,
  langCode,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { isSpeaking, rate, setRate, currentSentenceIndex, sentences, speakText, stopSpeaking, replay } = useSpeech(langCode);

  const step = steps[currentStep] || steps[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    stopSpeaking();
    if (!isLast) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(step.speechText);
    }
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        margin: '16px 0',
      }}
    >
      {/* Thin Progress Bar on top */}
      <div style={{ height: '3px', backgroundColor: 'var(--bg-subtle)', width: '100%' }}>
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--primary)',
            width: `${progressPercent}%`,
            transition: 'width 0.25s ease',
          }}
        />
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Step Header: Step label & Audio controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {stepIndicatorText(currentStep + 1, steps.length)}
            </span>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {step.title}
            </h3>
          </div>

          {/* Audio controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Secondary Audio Button */}
            <button
              type="button"
              onClick={handleToggleSpeak}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '36px',
                padding: '0 12px',
                fontSize: '13px',
                fontWeight: 500,
              }}
              aria-label={isSpeaking ? 'Dừng đọc' : 'Nghe đọc bước này'}
            >
              {isSpeaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={15} />}
              <span>{isSpeaking ? 'Dừng đọc' : 'Nghe đọc'}</span>
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={replay}
                title="Phát lại từ đầu"
                className="btn-secondary"
                style={{
                  minHeight: '36px',
                  width: '36px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RotateCcw size={14} />
              </button>
            )}

            {/* Clearly labeled speed selector */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'var(--bg-subtle)',
                padding: '2px 4px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ fontSize: '11px', padding: '0 4px' }}>Tốc độ:</span>
              <button
                type="button"
                onClick={() => setRate(0.75)}
                style={{
                  border: 'none',
                  background: rate === 0.75 ? 'var(--surface)' : 'transparent',
                  color: rate === 0.75 ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: rate === 0.75 ? 700 : 400,
                  borderRadius: '3px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  boxShadow: rate === 0.75 ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                0.75x
              </button>
              <button
                type="button"
                onClick={() => setRate(1.0)}
                style={{
                  border: 'none',
                  background: rate === 1.0 ? 'var(--surface)' : 'transparent',
                  color: rate === 1.0 ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: rate === 1.0 ? 700 : 400,
                  borderRadius: '3px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  boxShadow: rate === 1.0 ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                1x
              </button>
            </div>
          </div>
        </div>

        {/* Spoken Text Sentence Highlighting Box (if speaking) */}
        {isSpeaking && sentences.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid rgba(11, 79, 156, 0.2)',
              marginBottom: '16px',
              fontSize: '15px',
              lineHeight: 1.6,
            }}
          >
            {sentences.map((sent, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: currentSentenceIndex === idx ? 'rgba(255, 230, 0, 0.35)' : 'transparent',
                  fontWeight: currentSentenceIndex === idx ? 600 : 400,
                  color: 'var(--text)',
                  padding: '1px 3px',
                  borderRadius: '2px',
                }}
              >
                {sent}{' '}
              </span>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div style={{ minHeight: '140px', marginBottom: '20px' }}>
          {step.content}
        </div>

        {/* Step Navigation Controls: "Quay lại" hidden on step 1, "Tiếp theo" is primary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isFirst ? 'flex-end' : 'space-between',
            gap: '12px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
          }}
        >
          {!isFirst && (
            <button
              type="button"
              onClick={handlePrev}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '42px',
                padding: '0 18px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={16} />
              <span>{prevBtnText}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isLast}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '42px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: 600,
              opacity: isLast ? 0.5 : 1,
              cursor: isLast ? 'default' : 'pointer',
            }}
          >
            <span>{isLast ? 'Đã hoàn tất' : nextBtnText}</span>
            {!isLast && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
