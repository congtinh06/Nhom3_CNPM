import React from 'react';

export interface AdminTabItem {
  id: string;
  label: string;
}

export interface AdminTabsProps {
  tabs: AdminTabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ tabs, active, onChange, className = '' }) => {
  return (
    <div className={`adm-tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`adm-tab${selected ? ' adm-tab-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
