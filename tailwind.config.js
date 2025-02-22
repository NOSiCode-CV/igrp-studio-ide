const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        // Include your main app and components directories
        './app/**/*.{ts,tsx}', // Your app source code
        './components/**/*.{ts,tsx}', // Your custom components

        // Optionally include any other directories you want Tailwind to scan for classes
        './src/**/*.{ts,tsx,js,jsx}', // If you have additional files in `src/`
        './index.html', // Your HTML file (if applicable)
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
			backgroundImage: {
				'custom-pattern': `
				 	linear-gradient(90deg, #fcfcfc 9px, transparent 1%) center, 
					linear-gradient(#fcfcfc 9px, transparent 1%) center, 
					#9DADC3
				`,
			  },
			  backgroundSize: {
				'10': '10px 10px',
			  },
			  backgroundPosition: {
				'top-left': 'top left',
			  },
            colors: {
                igrp: {
                    light: '#008054',
                    DEFAULT: '#008054',
                    dark: '#3AA0D9',
                },
                
            },
            
        },
    },
    plugins: [require('tailwindcss-animate'),
		function ({ addUtilities }) {
			const newUtilities = {
			  '.bg-custom-pattern': {
				background: `
				  	linear-gradient(90deg, #fcfcfc 9px, transparent 1%) center, 
					linear-gradient(#fcfcfc 9px, transparent 1%) center, 
					#9DADC3
				`,
				'background-size': '10px 10px',
				'background-position': 'top left',
			  },
			};
			addUtilities(newUtilities, ['responsive', 'hover']);
		  },
	],
};
