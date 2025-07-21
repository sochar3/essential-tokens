import React from 'react';

const defaultIconStyle = { width: '16px', height: '16px' };
const defaultIconProps = {
  fill: 'none',
  stroke: 'currentColor',
  viewBox: '0 0 24 24',
  style: defaultIconStyle
};

export const UploadIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export const PaletteIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const FrameIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

export const FileSearchIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const XIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const InfoIcon = () => (
  <svg {...defaultIconProps}>
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8h.01" />
  </svg>
);

export const DocumentIcon = () => (
  <svg {...defaultIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4M7 16h10M3 4h18c.6 0 1 .4 1 1v14c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1z" />
  </svg>
);

export const TypeIcon = () => (
  <svg width="18" height="15" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={defaultIconStyle}>
    <path d="M7 14V4C7 3.46957 6.78914 2.96101 6.41406 2.58594C6.03899 2.21086 5.53043 2 5 2H4C3.44772 2 3 1.55228 3 1C3 0.447715 3.44772 0 4 0H5C6.06087 0 7.07798 0.42173 7.82812 1.17188C7.8876 1.23135 7.9447 1.29274 8 1.35547C8.0553 1.29274 8.1124 1.23135 8.17188 1.17188C8.92202 0.42173 9.93913 0 11 0H12C12.5523 0 13 0.447715 13 1C13 1.55228 12.5523 2 12 2H11C10.4696 2 9.96101 2.21086 9.58594 2.58594C9.21086 2.96101 9 3.46957 9 4V14C9 14.5304 9.21087 15.039 9.58594 15.4141C9.96101 15.7891 10.4696 16 11 16H12C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18H11C9.93913 18 8.92202 17.5783 8.17188 16.8281C8.11222 16.7685 8.05545 16.7065 8 16.6436C7.94455 16.7065 7.88778 16.7685 7.82812 16.8281C7.07798 17.5783 6.06087 18 5 18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H5L5.19727 15.9902C5.65526 15.9449 6.08578 15.7423 6.41406 15.4141C6.78913 15.039 7 14.5304 7 14ZM0 11V7C0 6.20435 0.316297 5.44152 0.878906 4.87891C1.44152 4.3163 2.20435 4 3 4H4C4.55228 4 5 4.44772 5 5C5 5.55228 4.55228 6 4 6H3C2.73478 6 2.48051 6.10543 2.29297 6.29297C2.10543 6.48051 2 6.73478 2 7V11C2 11.2652 2.10543 11.5195 2.29297 11.707C2.48051 11.8946 2.73478 12 3 12H4C4.55228 12 5 12.4477 5 13C5 13.5523 4.55228 14 4 14H3C2.20435 14 1.44152 13.6837 0.878906 13.1211C0.316297 12.5585 0 11.7956 0 11ZM20 11V7C20 6.73478 19.8946 6.48051 19.707 6.29297C19.5195 6.10543 19.2652 6 19 6H12C11.4477 6 11 5.55228 11 5C11 4.44772 11.4477 4 12 4H19C19.7957 4 20.5585 4.3163 21.1211 4.87891C21.6837 5.44151 22 6.20435 22 7V11C22 11.7957 21.6837 12.5585 21.1211 13.1211C20.5585 13.6837 19.7957 14 19 14H12C11.4477 14 11 13.5523 11 13C11 12.4477 11.4477 12 12 12H19C19.2652 12 19.5195 11.8946 19.707 11.707C19.8946 11.5195 20 11.2652 20 11Z" fill="currentColor"/>
  </svg>
);

// Large icons for navigation (18px)
const largeIconStyle = { width: '18px', height: '18px' };
const largeIconProps = {
  fill: 'none',
  stroke: 'currentColor',
  viewBox: '0 0 24 24',
  style: largeIconStyle
};

export const DocumentIconLarge = () => (
  <svg {...largeIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4M7 16h10M3 4h18c.6 0 1 .4 1 1v14c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1z" />
  </svg>
);

export const PaletteIconLarge = () => (
  <svg {...largeIconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
  </svg>
);

export const TypeIconLarge = () => (
  <svg width="18" height="15" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={largeIconStyle}>
    <path d="M7 14V4C7 3.46957 6.78914 2.96101 6.41406 2.58594C6.03899 2.21086 5.53043 2 5 2H4C3.44772 2 3 1.55228 3 1C3 0.447715 3.44772 0 4 0H5C6.06087 0 7.07798 0.42173 7.82812 1.17188C7.8876 1.23135 7.9447 1.29274 8 1.35547C8.0553 1.29274 8.1124 1.23135 8.17188 1.17188C8.92202 0.42173 9.93913 0 11 0H12C12.5523 0 13 0.447715 13 1C13 1.55228 12.5523 2 12 2H11C10.4696 2 9.96101 2.21086 9.58594 2.58594C9.21086 2.96101 9 3.46957 9 4V14C9 14.5304 9.21087 15.039 9.58594 15.4141C9.96101 15.7891 10.4696 16 11 16H12C12.5523 16 13 16.4477 13 17C13 17.5523 12.5523 18 12 18H11C9.93913 18 8.92202 17.5783 8.17188 16.8281C8.11222 16.7685 8.05545 16.7065 8 16.6436C7.94455 16.7065 7.88778 16.7685 7.82812 16.8281C7.07798 17.5783 6.06087 18 5 18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H5L5.19727 15.9902C5.65526 15.9449 6.08578 15.7423 6.41406 15.4141C6.78913 15.039 7 14.5304 7 14ZM0 11V7C0 6.20435 0.316297 5.44152 0.878906 4.87891C1.44152 4.3163 2.20435 4 3 4H4C4.55228 4 5 4.44772 5 5C5 5.55228 4.55228 6 4 6H3C2.73478 6 2.48051 6.10543 2.29297 6.29297C2.10543 6.48051 2 6.73478 2 7V11C2 11.2652 2.10543 11.5195 2.29297 11.707C2.48051 11.8946 2.73478 12 3 12H4C4.55228 12 5 12.4477 5 13C5 13.5523 4.55228 14 4 14H3C2.20435 14 1.44152 13.6837 0.878906 13.1211C0.316297 12.5585 0 11.7956 0 11ZM20 11V7C20 6.73478 19.8946 6.48051 19.707 6.29297C19.5195 6.10543 19.2652 6 19 6H12C11.4477 6 11 5.55228 11 5C11 4.44772 11.4477 4 12 4H19C19.7957 4 20.5585 4.3163 21.1211 4.87891C21.6837 5.44151 22 6.20435 22 7V11C22 11.7957 21.6837 12.5585 21.1211 13.1211C20.5585 13.6837 19.7957 14 19 14H12C11.4477 14 11 13.5523 11 13C11 12.4477 11.4477 12 12 12H19C19.2652 12 19.5195 11.8946 19.707 11.707C19.8946 11.5195 20 11.2652 20 11Z" fill="currentColor"/>
  </svg>
); 