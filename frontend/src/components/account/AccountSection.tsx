import React from 'react';

interface AccountSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  id,
  title,
  description,
  children,
}) => {
  return (
    <section id={id} className="ac-section" aria-labelledby={`${id}-title`}>
      <header className="ac-section-head">
        <h2 id={`${id}-title`} className="ac-section-title">
          {title}
        </h2>
        {description && <p className="ac-section-desc">{description}</p>}
      </header>
      <div className="ac-section-body">{children}</div>
    </section>
  );
};

export default AccountSection;
