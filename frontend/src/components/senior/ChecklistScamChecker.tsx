import React, { useState } from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { seniorTranslations } from '../../data/seniorI18n';
import { ShieldCheck, AlertTriangle, AlertOctagon, RotateCcw, Check, X, Info } from 'lucide-react';

export const ChecklistScamChecker: React.FC = () => {
  const { language } = usePreferences();
  const t = seniorTranslations[language].checklist;

  // Track answers for each question id: true (Yes), false (No), or null (unanswered)
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const handleAnswer = (qId: number, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleReset = () => {
    setAnswers({});
  };

  // Evaluate risk level based on answers:
  // - Any dangerous question answered YES => Danger
  // - 1 or more other questions answered YES => Warning
  // - All answered NO => Safe
  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === t.questions.length;

  const hasDanger = t.questions.some((q) => q.dangerIfYes && answers[q.id] === true);
  const yesCount = Object.values(answers).filter((v) => v === true).length;

  let riskLevel: 'SAFE' | 'WARNING' | 'DANGER' | null = null;
  if (answeredCount > 0) {
    if (hasDanger) {
      riskLevel = 'DANGER';
    } else if (yesCount > 0) {
      riskLevel = 'WARNING';
    } else if (isComplete) {
      riskLevel = 'SAFE';
    }
  }

  const renderResultCard = () => {
    if (!riskLevel) return null;

    if (riskLevel === 'DANGER') {
      return (
        <div
          role="alert"
          style={{
            marginTop: '28px',
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'rgba(158, 31, 24, 0.08)',
            border: '2px solid var(--danger)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <AlertOctagon size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>
              {t.resultDanger}
            </h3>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: '0 0 12px 0', fontWeight: 500 }}>
            {t.dangerAdvice}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-muted)' }}>
            <Info size={18} />
            <span>{t.disclaimer}</span>
          </div>
        </div>
      );
    }

    if (riskLevel === 'WARNING') {
      return (
        <div
          role="alert"
          style={{
            marginTop: '28px',
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: 'rgba(122, 74, 0, 0.08)',
            border: '2px solid var(--warning)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--warning)', margin: 0 }}>
              {t.resultWarning}
            </h3>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: '0 0 12px 0', fontWeight: 500 }}>
            {t.warningAdvice}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-muted)' }}>
            <Info size={18} />
            <span>{t.disclaimer}</span>
          </div>
        </div>
      );
    }

    return (
      <div
        role="status"
        style={{
          marginTop: '28px',
          padding: '24px',
          borderRadius: '8px',
          backgroundColor: 'rgba(20, 89, 47, 0.08)',
          border: '2px solid var(--safe)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--safe)', flexShrink: 0 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--safe)', margin: 0 }}>
            {t.resultSafe}
          </h3>
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: '0 0 12px 0', fontWeight: 500 }}>
          {t.safeAdvice}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-muted)' }}>
          <Info size={18} />
          <span>{t.disclaimer}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px 0' }}>
          {t.title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {t.subtitle}
        </p>
      </div>

      {/* Questions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {t.questions.map((q) => {
          const answer = answers[q.id];
          return (
            <div
              key={q.id}
              style={{
                padding: '20px 24px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginRight: '8px' }}>
                  #{q.id}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.5 }}>
                  {q.text}
                </span>
              </div>

              {/* Yes / No buttons (Min height 56px) */}
              <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleAnswer(q.id, true)}
                  style={{
                    minHeight: '56px',
                    minWidth: '96px',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    border: answer === true ? '3px solid var(--danger)' : '1.5px solid var(--border)',
                    backgroundColor: answer === true ? 'rgba(158, 31, 24, 0.12)' : 'var(--surface)',
                    color: answer === true ? 'var(--danger)' : 'var(--text)',
                    fontSize: '18px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={18} />
                  <span>{t.yesBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnswer(q.id, false)}
                  style={{
                    minHeight: '56px',
                    minWidth: '96px',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    border: answer === false ? '3px solid var(--safe)' : '1.5px solid var(--border)',
                    backgroundColor: answer === false ? 'rgba(20, 89, 47, 0.12)' : 'var(--surface)',
                    color: answer === false ? 'var(--safe)' : 'var(--text)',
                    fontSize: '18px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <X size={18} />
                  <span>{t.noBtn}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Result Card */}
      {renderResultCard()}

      {/* Reset button */}
      {answeredCount > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '48px',
              padding: '10px 18px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1.5px solid var(--border)',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
            <span>{t.resetBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
};
