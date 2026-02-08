import { useEffect, useRef } from 'react';

interface FluidCursorProps {
    color?: string;
    secondaryColor?: string;
}

export default function FluidCursor({ color = '#D4A373', secondaryColor = '#8B5E3C' }: FluidCursorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const blobRef = useRef({ x: 0, y: 0, radius: 0 });
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        // Resize handler
        const handleResize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
                // Initialize blob position to center
                if (blobRef.current.x === 0) {
                    blobRef.current.x = canvas.width / 2;
                    blobRef.current.y = canvas.height / 2;
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        // Mouse handler
        const handleMouseMove = (e: MouseEvent) => {
            // Get mouse position relative to canvas
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };
        // Attach to window to track mouse even if outside strict bounds, 
        // but for this component which is a decorative card, maybe just track on the card?
        // The user said "Mouse position as light source/gravity point".
        // Usually these effects track mouse relative to the component.
        // Let's attach to the canvas's parent or window if we want it to react always.
        // For a contained effect, tracking within the component is safer.
        // But to make it lively, let's track on window but map to canvas space.
        
        const updateMouse = (e: MouseEvent) => {
             const rect = canvas.getBoundingClientRect();
             mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
             };
        };
        
        window.addEventListener('mousemove', updateMouse);

        // Noise/Blob logic
        const drawBlob = (x: number, y: number, time: number) => {
            const baseRadius = Math.min(canvas.width, canvas.height) * 0.4;
            const variation = baseRadius * 0.2; // How much it deforms
            
            ctx.beginPath();
            for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
                // Simple pseudo-noise using overlapping sine waves
                const r = baseRadius + 
                          Math.sin(angle * 3 + time * 2) * variation * 0.5 + 
                          Math.cos(angle * 5 - time * 1.5) * variation * 0.3 +
                          Math.sin(angle * 7 + time) * variation * 0.2;
                
                const px = x + Math.cos(angle) * r;
                const py = y + Math.sin(angle) * r;
                
                if (angle === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            // Gradient
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, baseRadius * 1.5);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.4, secondaryColor);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        const render = () => {
            time += 0.01;
            
            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Physics: Lerp blob towards mouse
            // We want the blob to stay within bounds mostly, or just follow freely.
            // Let's make it follow freely.
            const targetX = mouseRef.current.x;
            const targetY = mouseRef.current.y;
            
            // Lerp factor (0.1 = slow/viscous, 0.2 = fast)
            blobRef.current.x += (targetX - blobRef.current.x) * 0.08;
            blobRef.current.y += (targetY - blobRef.current.y) * 0.08;
            
            // Draw
            // Use globalCompositeOperation to create nice blending
            ctx.globalCompositeOperation = 'screen'; // or 'lighter'
            drawBlob(blobRef.current.x, blobRef.current.y, time);
            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', updateMouse);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, secondaryColor]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ filter: 'blur(20px)' }} />;
}
