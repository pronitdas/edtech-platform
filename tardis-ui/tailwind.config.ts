import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			
  			// Primary colors
  			primary: {
  				50: 'var(--primary-50)',
  				100: 'var(--primary-100)',
  				200: 'var(--primary-200)',
  				300: 'var(--primary-300)',
  				400: 'var(--primary-400)',
  				500: 'var(--primary-500)',
  				600: 'var(--primary-600)',
  				700: 'var(--primary-700)',
  				800: 'var(--primary-800)',
  				900: 'var(--primary-900)',
  				950: 'var(--primary-950)',
  			},
  			
  			// Secondary colors
  			secondary: {
  				50: 'var(--secondary-50)',
  				100: 'var(--secondary-100)',
  				200: 'var(--secondary-200)',
  				300: 'var(--secondary-300)',
  				400: 'var(--secondary-400)',
  				500: 'var(--secondary-500)',
  				600: 'var(--secondary-600)',
  				700: 'var(--secondary-700)',
  				800: 'var(--secondary-800)',
  				900: 'var(--secondary-900)',
  				950: 'var(--secondary-950)',
  			},
  			
  			// Feedback colors
  			success: {
  				50: 'var(--success-50)',
  				500: 'var(--success-500)',
  				700: 'var(--success-700)',
  			},
  			warning: {
  				50: 'var(--warning-50)',
  				500: 'var(--warning-500)',
  				700: 'var(--warning-700)',
  			},
  			error: {
  				50: 'var(--error-50)',
  				500: 'var(--error-500)',
  				700: 'var(--error-700)',
  			},
  			info: {
  				50: 'var(--info-50)',
  				500: 'var(--info-500)',
  				700: 'var(--info-700)',
  			},
  			
  			// Neutral colors
  			gray: {
  				50: 'var(--gray-50)',
  				100: 'var(--gray-100)',
  				200: 'var(--gray-200)',
  				300: 'var(--gray-300)',
  				400: 'var(--gray-400)',
  				500: 'var(--gray-500)',
  				600: 'var(--gray-600)',
  				700: 'var(--gray-700)',
  				800: 'var(--gray-800)',
  				900: 'var(--gray-900)',
  				950: 'var(--gray-950)',
  			},
  			
  			// Cognitive load colors
  			cognitive: {
  				low: 'var(--cognitive-low)',
  				medium: 'var(--cognitive-medium)',
  				high: 'var(--cognitive-high)',
  			},
  		},
  		
  		// Typography
  		fontFamily: {
  			sans: ['var(--font-sans)'],
  			mono: ['var(--font-mono)'],
  			math: ['var(--font-math)'],
  		},
  		
  		fontSize: {
  			xs: 'var(--text-xs)',
  			sm: 'var(--text-sm)',
  			base: 'var(--text-base)',
  			lg: 'var(--text-lg)',
  			xl: 'var(--text-xl)',
  			'2xl': 'var(--text-2xl)',
  			'3xl': 'var(--text-3xl)',
  			'4xl': 'var(--text-4xl)',
  			'5xl': 'var(--text-5xl)',
  		},
  		
  		fontWeight: {
  			regular: 'var(--font-regular)',
  			medium: 'var(--font-medium)',
  			semibold: 'var(--font-semibold)',
  			bold: 'var(--font-bold)',
  		},
  		
  		lineHeight: {
  			none: 'var(--leading-none)',
  			tight: 'var(--leading-tight)',
  			snug: 'var(--leading-snug)',
  			normal: 'var(--leading-normal)',
  			relaxed: 'var(--leading-relaxed)',
  			loose: 'var(--leading-loose)',
  		},
  		
  		// Spacing
  		spacing: {
  			1: 'var(--space-1)',
  			2: 'var(--space-2)',
  			3: 'var(--space-3)',
  			4: 'var(--space-4)',
  			5: 'var(--space-5)',
  			6: 'var(--space-6)',
  			8: 'var(--space-8)',
  			10: 'var(--space-10)',
  			12: 'var(--space-12)',
  			16: 'var(--space-16)',
  			20: 'var(--space-20)',
  			24: 'var(--space-24)',
  		},
  		
  		// Border Radius
  		borderRadius: {
  			sm: 'var(--radius-sm)',
  			md: 'var(--radius-md)',
  			lg: 'var(--radius-lg)',
  			xl: 'var(--radius-xl)',
  			'2xl': 'var(--radius-2xl)',
  			full: 'var(--radius-full)',
  		},
  		
  		// Shadows
  		boxShadow: {
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate"),require('tailwind-scrollbar')],
  
} satisfies Config;
