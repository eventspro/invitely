import React from 'react';
import { WeddingConfig } from '../types';

/**
 * Shared TemplateFooter component — used by ALL templates.
 *
 * All footer content (couple names, separator, thank-you message, date) is
 * driven by WeddingConfig so it is fully configurable from the admin panel
 * without touching template code.
 *
 * Usage in any template:
 *   <TemplateFooter
 *     config={safeConfig}
 *     themeColors={config.theme?.colors}
 *     defaultSeparator="∞"           // per-template fallback if admin left field empty
 *     footerClassName="bg-charcoal text-white py-12"   // optional style override
 *     footerStyle={gradientStyle}    // optional inline style override
 *   />
 */

interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

interface TemplateFooterProps {
  config: WeddingConfig;
  themeColors?: ThemeColors;
  /** Fallback separator symbol shown if admin hasn't set one. Default: ∞ */
  defaultSeparator?: string;
  /** Extra class names for the <footer> element */
  footerClassName?: string;
  /** Inline style for the <footer> element (e.g. gradient background) */
  footerStyle?: React.CSSProperties;
  /** Class names for the thank-you paragraph */
  thankYouClassName?: string;
  /** Class names for the date line */
  dateClassName?: string;
}

export const TemplateFooter: React.FC<TemplateFooterProps> = ({
  config,
  themeColors,
  defaultSeparator = '∞',
  footerClassName = 'py-12',
  footerStyle,
  thankYouClassName = 'text-lg mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed',
  dateClassName = 'text-sm opacity-75',
}) => {
  const separatorColor =
    themeColors?.accent || themeColors?.primary || undefined;

  const separator = config.footer?.separator || defaultSeparator;

  return (
    <footer className={footerClassName} style={footerStyle}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="ornament w-full h-8 mb-8 opacity-50"></div>

        {/* Couple names with configurable separator */}
        <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-3">
          <span>{config.couple.groomName}</span>
          <span className="mx-1" style={{ color: separatorColor }}>
            {separator}
          </span>
          <span>{config.couple.brideName}</span>
        </h3>

        {/* Configurable thank-you message */}
        <p className={thankYouClassName}>
          {config.footer?.thankYouMessage}
        </p>

        {/* Configurable display date */}
        <div className={dateClassName}>
          {config.wedding?.displayDate}
        </div>
      </div>
    </footer>
  );
};

export default TemplateFooter;
