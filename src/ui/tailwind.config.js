/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#050505',
                card: '#0c0c0c',
                'card-hover': '#121212',
                accent: {
                    DEFAULT: '#6366f1',
                    soft: 'rgba(99, 102, 241, 0.1)',
                },
                border: 'rgba(255, 255, 255, 0.08)',
                'text-main': '#ffffff',
                'text-dim': '#888888',
            },
            fontFamily: {
                serif: ['Playfair Display', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
