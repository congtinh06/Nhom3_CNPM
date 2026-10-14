import React from 'react';
import { SupportedLanguage } from '../../types';

interface CountryFlagProps {
  code: SupportedLanguage;
  width?: number;
  height?: number;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  width = 18,
  height = 13,
  className = 'lang-flag',
}) => {
  switch (code) {
    case 'vi':
      return (
        <svg
          viewBox="0 0 640 480"
          width={width}
          height={height}
          className={className}
          aria-hidden="true"
        >
          <rect width="640" height="480" fill="#da251d" rx="4" />
          <polygon
            fill="#ffff00"
            points="320,85 363,218 503,218 389,300 433,433 320,351 207,433 251,300 137,218 277,218"
          />
        </svg>
      );

    case 'en':
      return (
        <svg
          viewBox="0 0 640 480"
          width={width}
          height={height}
          className={className}
          aria-hidden="true"
        >
          <clipPath id="uk-flag-clip">
            <rect width="640" height="480" rx="4" />
          </clipPath>
          <g clipPath="url(#uk-flag-clip)">
            <path fill="#012169" d="M0 0h640v480H0z" />
            <path stroke="#ffffff" strokeWidth="60" d="m0 0 640 480M640 0 0 480" />
            <path stroke="#c8102e" strokeWidth="40" d="m0 0 640 480M640 0 0 480" />
            <path stroke="#ffffff" strokeWidth="100" d="M320 0v480M0 240h640" />
            <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640" />
          </g>
        </svg>
      );

    case 'ja':
      return (
        <svg
          viewBox="0 0 640 480"
          width={width}
          height={height}
          className={className}
          aria-hidden="true"
        >
          <rect
            width="640"
            height="480"
            fill="#ffffff"
            rx="4"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1"
          />
          <circle cx="320" cy="240" r="144" fill="#bc002d" />
        </svg>
      );

    case 'ko':
      return (
        <svg
          viewBox="0 0 640 480"
          width={width}
          height={height}
          className={className}
          aria-hidden="true"
        >
          <rect
            width="640"
            height="480"
            fill="#ffffff"
            rx="4"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1"
          />
          {/* Taegeuk Circle (Red on top, Blue on bottom) */}
          <path
            d="M 320,120 A 120,120 0 0,1 320,360 A 60,60 0 0,0 320,240 A 60,60 0 0,1 320,120 Z"
            fill="#cd2e3a"
          />
          <path
            d="M 320,360 A 120,120 0 0,1 320,120 A 60,60 0 0,0 320,240 A 60,60 0 0,1 320,360 Z"
            fill="#0047a0"
          />
          {/* 4 Trigrams */}
          <g fill="#000000" stroke="#000000" strokeWidth="10" strokeLinecap="round">
            {/* Top-left: Geon (3 unbroken) */}
            <line x1="145" y1="130" x2="195" y2="90" />
            <line x1="155" y1="142" x2="205" y2="102" />
            <line x1="165" y1="154" x2="215" y2="114" />

            {/* Bottom-right: Gon (3 broken) */}
            <line x1="425" y1="366" x2="447" y2="348" />
            <line x1="453" y1="344" x2="475" y2="326" />
            <line x1="435" y1="378" x2="457" y2="360" />
            <line x1="463" y1="356" x2="485" y2="338" />
            <line x1="445" y1="390" x2="467" y2="372" />
            <line x1="473" y1="368" x2="495" y2="350" />

            {/* Top-right: Gam (1 broken, 1 unbroken, 1 broken) */}
            <line x1="445" y1="90" x2="467" y2="108" />
            <line x1="473" y1="112" x2="495" y2="130" />
            <line x1="435" y1="102" x2="485" y2="142" />
            <line x1="425" y1="114" x2="447" y2="132" />
            <line x1="453" y1="136" x2="475" y2="154" />

            {/* Bottom-left: Ri (1 unbroken, 1 broken, 1 unbroken) */}
            <line x1="165" y1="326" x2="215" y2="366" />
            <line x1="155" y1="338" x2="177" y2="356" />
            <line x1="183" y1="360" x2="205" y2="378" />
            <line x1="145" y1="350" x2="195" y2="390" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
