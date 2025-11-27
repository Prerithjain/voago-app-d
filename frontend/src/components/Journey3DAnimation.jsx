import React, { useEffect, useRef } from 'react';

const Journey3DAnimation = ({ itineraryItems = [] }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth * 2; // Retina display
        const height = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        // Animation state
        let time = 0;
        const particles = [];
        const numParticles = 50;

        // Create particles
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width / 2,
                y: Math.random() * height / 2,
                z: Math.random() * 1000,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                color: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`
            });
        }

        // Journey path points
        const pathPoints = itineraryItems.map((item, idx) => ({
            x: (width / 2 / (itineraryItems.length + 1)) * (idx + 1),
            y: height / 4 + Math.sin(idx * 0.5) * 50,
            label: item.place_name || `Stop ${idx + 1}`,
            day: item.day || 1
        }));

        // Animation loop
        const animate = () => {
            time += 0.01;

            // Clear canvas with gradient background
            const gradient = ctx.createLinearGradient(0, 0, width / 2, height / 2);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#f093fb');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width / 2, height / 2);

            // Draw animated particles
            particles.forEach(particle => {
                particle.z -= particle.speed;
                if (particle.z <= 0) {
                    particle.z = 1000;
                    particle.x = Math.random() * width / 2;
                    particle.y = Math.random() * height / 2;
                }

                const scale = 1000 / (1000 + particle.z);
                const x = (particle.x - width / 4) * scale + width / 4;
                const y = (particle.y - height / 4) * scale + height / 4;
                const size = particle.size * scale;

                ctx.fillStyle = particle.color;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // Draw journey path
            if (pathPoints.length > 0) {
                // Draw connecting lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 5]);
                ctx.beginPath();
                pathPoints.forEach((point, idx) => {
                    const y = point.y + Math.sin(time + idx) * 10;
                    if (idx === 0) {
                        ctx.moveTo(point.x, y);
                    } else {
                        ctx.lineTo(point.x, y);
                    }
                });
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw location markers
                pathPoints.forEach((point, idx) => {
                    const y = point.y + Math.sin(time + idx) * 10;
                    const pulse = Math.sin(time * 2 + idx) * 0.2 + 1;

                    // Outer glow
                    const glowGradient = ctx.createRadialGradient(point.x, y, 0, point.x, y, 30 * pulse);
                    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(point.x, y, 30 * pulse, 0, Math.PI * 2);
                    ctx.fill();

                    // Main marker
                    const markerGradient = ctx.createRadialGradient(point.x, y, 0, point.x, y, 20);
                    markerGradient.addColorStop(0, '#fff');
                    markerGradient.addColorStop(1, '#667eea');
                    ctx.fillStyle = markerGradient;
                    ctx.beginPath();
                    ctx.arc(point.x, y, 20, 0, Math.PI * 2);
                    ctx.fill();

                    // Marker number
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(idx + 1, point.x, y);

                    // Label
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px Inter, sans-serif';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    ctx.shadowBlur = 4;
                    ctx.fillText(point.label, point.x, y + 40);
                    ctx.shadowBlur = 0;

                    // Day badge
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.beginPath();
                    ctx.roundRect(point.x - 25, y - 50, 50, 20, 10);
                    ctx.fill();
                    ctx.fillStyle = '#667eea';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.fillText(`Day ${point.day}`, point.x, y - 40);
                });

                // Draw animated travel indicator
                const progress = (Math.sin(time) + 1) / 2;
                const currentSegment = Math.floor(progress * (pathPoints.length - 1));
                const segmentProgress = (progress * (pathPoints.length - 1)) % 1;

                if (currentSegment < pathPoints.length - 1) {
                    const start = pathPoints[currentSegment];
                    const end = pathPoints[currentSegment + 1];
                    const x = start.x + (end.x - start.x) * segmentProgress;
                    const y = start.y + (end.y - start.y) * segmentProgress +
                        Math.sin(time + currentSegment) * 10;

                    // Travel indicator (plane/car icon)
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.atan2(end.y - start.y, end.x - start.x));

                    // Draw simple plane shape
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(20, 0);
                    ctx.lineTo(-10, -8);
                    ctx.lineTo(-10, 8);
                    ctx.closePath();
                    ctx.fill();

                    // Wings
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-15, -15);
                    ctx.lineTo(-10, -8);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-15, 15);
                    ctx.lineTo(-10, 8);
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }
            }

            // Draw title
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.fillText('Your Journey Awaits', width / 4, 40);
            ctx.shadowBlur = 0;

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [itineraryItems]);

    return (
        <div className="journey-3d-container">
            <canvas
                ref={canvasRef}
                className="journey-canvas"
            />
            <style jsx>{`
                .journey-3d-container {
                    width: 100%;
                    height: 400px;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .journey-canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
            `}</style>
        </div>
    );
};

export default Journey3DAnimation;
