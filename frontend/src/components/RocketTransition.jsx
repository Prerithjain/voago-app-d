import React from 'react';
import { motion } from 'framer-motion';

export default function RocketTransition() {
    return (
        <motion.div
            className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Paper Rocket */}
            <motion.svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                className="absolute"
                initial={{
                    x: -150,
                    y: typeof window !== 'undefined' ? window.innerHeight + 150 : 800,
                    rotate: -45
                }}
                animate={{
                    x: typeof window !== 'undefined' ? window.innerWidth + 150 : 1200,
                    y: -150,
                    rotate: 45
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {/* Rocket Body */}
                <path d="M45 20 L50 10 L55 20 Z" fill="#ff6b6b" />
                <rect x="42" y="20" width="16" height="35" rx="2" fill="#feca57" />

                {/* Windows */}
                <circle cx="50" cy="30" r="4" fill="#48dbfb" />
                <circle cx="50" cy="42" r="4" fill="#48dbfb" />

                {/* Fins */}
                <path d="M42 45 L35 55 L42 55 Z" fill="#ff9ff3" />
                <path d="M58 45 L65 55 L58 55 Z" fill="#ff9ff3" />

                {/* Flames */}
                <motion.g
                    animate={{
                        scaleY: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                    }}
                    transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <path d="M42 55 L46 70 L50 55" fill="#ff6b6b" opacity="0.8" />
                    <path d="M50 55 L50 75 L54 55" fill="#feca57" opacity="0.9" />
                    <path d="M54 55 L58 70 L58 55" fill="#ff9ff3" opacity="0.8" />
                </motion.g>
            </motion.svg>

            {/* Confetti Trail */}
            {[...Array(25)].map((_, i) => {
                const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#0be881'];
                const randomColor = colors[i % colors.length];
                const randomX = typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1200;
                const randomY = typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 800;

                return (
                    <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: Math.random() * 8 + 4,
                            height: Math.random() * 8 + 4,
                            background: randomColor,
                            left: randomX,
                            top: randomY
                        }}
                        initial={{
                            scale: 0,
                            rotate: 0
                        }}
                        animate={{
                            scale: [0, 1.5, 0],
                            rotate: [0, 360],
                            y: [0, -100]
                        }}
                        transition={{
                            duration: 1.2,
                            delay: i * 0.03,
                            ease: "easeOut"
                        }}
                    />
                );
            })}

            {/* Star Particles */}
            {[...Array(15)].map((_, i) => {
                const randomX = typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1200;
                const randomY = typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 800;

                return (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute text-yellow-400"
                        style={{
                            left: randomX,
                            top: randomY,
                            fontSize: Math.random() * 20 + 10
                        }}
                        initial={{
                            scale: 0,
                            rotate: 0,
                            opacity: 0
                        }}
                        animate={{
                            scale: [0, 1, 0],
                            rotate: [0, 180],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 1,
                            delay: i * 0.05,
                            ease: "easeInOut"
                        }}
                    >
                        ✨
                    </motion.div>
                );
            })}

            {/* White Fade Overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
            />
        </motion.div>
    );
}
