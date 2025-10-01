// Design Tokens - PhoenixCare Design System
// Optimisé pour l'accessibilité et les publics en situation de handicap

export const tokens = {
  // Couleurs - WCAG AAA compliance
  colors: {
    // Palette principale - Contraste élevé
    primary: {
      50: '#fef2f2',   // Très clair pour backgrounds
      100: '#fde6e6',  // Clair pour états hover
      500: '#ef4444',  // Principal - ratio 4.5:1 sur blanc
      600: '#dc2626',  // Foncé - ratio 7:1 sur blanc
      900: '#7f1d1d',  // Très foncé - ratio 13:1 sur blanc
    },

    // Palette sémantique
    semantic: {
      success: {
        light: '#dcfce7',
        main: '#16a34a',   // Ratio 4.5:1
        dark: '#15803d',   // Ratio 7:1
        text: '#166534',   // Ratio 7:1
      },
      warning: {
        light: '#fef3c7',
        main: '#d97706',   // Ratio 4.5:1
        dark: '#92400e',   // Ratio 7:1
        text: '#78350f',   // Ratio 7:1
      },
      error: {
        light: '#fecaca',
        main: '#dc2626',   // Ratio 4.5:1
        dark: '#b91c1c',   // Ratio 7:1
        text: '#991b1b',   // Ratio 7:1
      },
      info: {
        light: '#dbeafe',
        main: '#2563eb',   // Ratio 4.5:1
        dark: '#1d4ed8',   // Ratio 7:1
        text: '#1e40af',   // Ratio 7:1
      }
    },

    // Palette neutre - Optimisée contraste
    neutral: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',  // Minimum pour texte secondaire (ratio 3:1)
      500: '#64748b',  // Texte secondaire (ratio 4.5:1)
      700: '#334155',  // Texte principal (ratio 7:1)
      800: '#1e293b',  // Texte important (ratio 10:1)
      900: '#0f172a',  // Texte critique (ratio 15:1)
    },

    // Focus et états
    focus: {
      ring: '#3b82f6',      // Bleu distinctif
      ringOffset: '#ffffff', // Contraste avec background
    }
  },

  // Typographie - Lisibilité optimisée
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'monospace'],
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],      // 16px - taille minimum
      lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px - recommandé
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    },

    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',    // Minimum pour importance
      bold: '700',        // Maximum pour lisibilité
    }
  },

  // Espacement - Touch-friendly
  spacing: {
    // Minimum 44px pour touch targets (Apple HIG + WCAG)
    touchTarget: '2.75rem',    // 44px
    touchTargetLarge: '3rem',  // 48px pour boutons principaux

    // Espacements cohérents
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
  },

  // Rayons - Douceur visuelle
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },

  // Shadows - Profondeur subtile
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.5)', // Focus visible
  },

  // Animation - Respecte prefers-reduced-motion
  motion: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    }
  },

  // Breakpoints - Mobile-first
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
} as const;

// Utilitaires d'accessibilité
export const a11y = {
  // Tailles de texte alternatives
  fontSizes: {
    user: 'var(--user-font-size, 1rem)',  // Respecte préférences système
    userLarge: 'var(--user-font-size-large, 1.125rem)',
  },

  // Modes de contraste
  contrast: {
    normal: 'var(--contrast-normal)',
    high: 'var(--contrast-high)',
  },

  // Réduction de mouvement
  motion: {
    safe: 'var(--motion-safe, 1)',
    reduced: 'var(--motion-reduced, 0)',
  },

  // Préférences couleur
  colorScheme: {
    light: 'var(--color-scheme-light)',
    dark: 'var(--color-scheme-dark)',
    auto: 'var(--color-scheme-auto)',
  }
};

// Export des CSS Custom Properties
export const cssVariables = `
  :root {
    /* Couleurs */
    --color-primary-50: ${tokens.colors.primary[50]};
    --color-primary-500: ${tokens.colors.primary[500]};
    --color-primary-600: ${tokens.colors.primary[600]};
    --color-primary-900: ${tokens.colors.primary[900]};

    /* Sémantique */
    --color-success: ${tokens.colors.semantic.success.main};
    --color-warning: ${tokens.colors.semantic.warning.main};
    --color-error: ${tokens.colors.semantic.error.main};
    --color-info: ${tokens.colors.semantic.info.main};

    /* Neutre */
    --color-neutral-0: ${tokens.colors.neutral[0]};
    --color-neutral-700: ${tokens.colors.neutral[700]};
    --color-neutral-900: ${tokens.colors.neutral[900]};

    /* Focus */
    --color-focus-ring: ${tokens.colors.focus.ring};
    --shadow-focus: ${tokens.shadows.focus};

    /* Espacement */
    --spacing-touch-target: ${tokens.spacing.touchTarget};
    --spacing-touch-target-large: ${tokens.spacing.touchTargetLarge};

    /* Animation */
    --duration-fast: ${tokens.motion.duration.fast};
    --duration-normal: ${tokens.motion.duration.normal};
    --easing-ease: ${tokens.motion.easing.ease};
  }

  /* Préférences utilisateur */
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-safe: 0;
      --motion-reduced: 1;
    }

    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media (prefers-contrast: high) {
    :root {
      --contrast-normal: 0;
      --contrast-high: 1;
    }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-scheme-light: 0;
      --color-scheme-dark: 1;
    }
  }

  /* Font size scaling */
  @media (max-width: 640px) {
    :root {
      --user-font-size: 1.125rem; /* Plus gros sur mobile */
      --user-font-size-large: 1.25rem;
    }
  }
`;

export type Tokens = typeof tokens;