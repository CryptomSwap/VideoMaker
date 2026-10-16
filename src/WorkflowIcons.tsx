import React from "react";

type IconProps = {
  color: string;
};

export const IconInquiry: React.FC<IconProps> = ({color}) => {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      <rect
        x="5"
        y="8"
        width="26"
        height="20"
        rx="6"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
      <path
        d="M9 15h13.5M9 21h8"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const IconCopy: React.FC<IconProps> = ({color}) => {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      <rect
        x="10"
        y="7"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
      <rect
        x="7"
        y="12"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
    </svg>
  );
};

export const IconSheet: React.FC<IconProps> = ({color}) => {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      <path
        d="M8 12h20M8 18h14M8 24h10"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const IconFollow: React.FC<IconProps> = ({color}) => {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="12" fill="none" stroke={color} strokeWidth="2.2" />
      <path
        d="M13 18h8.5M18 13.5L22.5 18 18 22.5"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ICONS = [IconInquiry, IconCopy, IconSheet, IconFollow];
