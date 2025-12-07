import React from 'react';

export const MindstreamLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Right half - Clean semicircle with "ms" */}
        <path d="M100 30 A70 70 0 0 1 100 170" />

        {/* Center vertical line */}
        <line x1="100" y1="30" x2="100" y2="170" />

        {/* "ms" cursive text flowing out */}
        <path
            d="M110 115 
         c5 -15, 12 -25, 18 -25 
         c8 0, 5 20, 12 20 
         c6 0, 8 -20, 15 -20 
         c10 0, -5 35, 20 25
         c15 -6, 25 -10, 40 -5"
            fill="none"
        />

        {/* Left half - Organic brain swirls */}
        {/* Top swirl cluster */}
        <path d="M100 45 C80 45, 65 35, 55 50 C45 65, 55 75, 70 70 C80 67, 85 55, 90 50" fill="none" />
        <path d="M90 50 C75 48, 55 45, 45 60 C35 75, 50 85, 65 80" fill="none" />
        <path d="M65 80 C50 82, 35 75, 30 90 C25 105, 40 110, 55 105" fill="none" />

        {/* Middle swirl cluster */}
        <path d="M100 85 C85 80, 60 70, 50 85 C40 100, 55 115, 75 105" fill="none" />
        <path d="M75 105 C55 110, 40 100, 35 115 C30 130, 50 140, 70 130" fill="none" />

        {/* Bottom swirl cluster */}
        <path d="M100 130 C80 125, 55 120, 45 135 C35 150, 55 165, 75 155" fill="none" />
        <path d="M75 155 C55 160, 45 150, 40 165 C35 180, 55 185, 75 175" fill="none" />
        <path d="M100 155 C85 155, 65 150, 55 165 C45 180, 65 185, 85 175" fill="none" />

        {/* Decorative inner swirls - teardrops */}
        <path d="M70 55 C65 50, 55 55, 60 65 C65 75, 75 70, 70 55" fill="none" />
        <path d="M55 90 C50 85, 40 90, 45 100 C50 110, 60 105, 55 90" fill="none" />
        <path d="M60 125 C55 120, 45 125, 50 135 C55 145, 65 140, 60 125" fill="none" />
        <path d="M75 160 C70 155, 60 160, 65 170 C70 180, 80 175, 75 160" fill="none" />

        {/* Additional organic flourishes */}
        <path d="M85 65 C80 60, 70 65, 75 75" fill="none" />
        <path d="M80 100 C75 95, 65 100, 70 110" fill="none" />
        <path d="M85 140 C80 135, 70 140, 75 150" fill="none" />
    </svg>
);
