import { Theme } from '@aws-amplify/ui-react';

export const authTheme: Theme = {
  name: 'bachelor-fantasy-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#fdf2f8',
          20: '#fce7f3',
          40: '#f9a8d4',
          60: '#f472b6',
          80: '#ec4899',
          90: '#e11d48',
          100: '#be185d',
        },
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
      },
    },
    components: {
      authenticator: {
        router: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        form: {
          padding: '2rem',
        },
      },
      button: {
        primary: {
          backgroundColor: '{colors.brand.primary.80}',
          color: '{colors.white}',
          _hover: {
            backgroundColor: '{colors.brand.primary.90}',
          },
          _focus: {
            backgroundColor: '{colors.brand.primary.90}',
          },
          _active: {
            backgroundColor: '{colors.brand.primary.100}',
          },
        },
      },
      fieldcontrol: {
        _focus: {
          borderColor: '{colors.brand.primary.80}',
        },
      },
      tabs: {
        item: {
          color: '{colors.brand.primary.80}',
          _active: {
            borderColor: '{colors.brand.primary.80}',
            color: '{colors.brand.primary.90}',
          },
        },
      },
    },
  },
};