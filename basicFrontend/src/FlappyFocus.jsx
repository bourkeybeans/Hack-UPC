import { useEffect, useRef, useState } from 'react';

export default function FlappyFocus({ isStreaming, lastBlinkTime }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('idle'); // idle, playing, gameover
  const [score, setScore] = useState(0);

  // Game constants
  const GRAVITY = 0.4;
  const JUMP_STRENGTH = -8;
  const PIPE_SPEED = 3;
  const PIPE_SPAWN_RATE = 120; // frames
  const PIPE_WIDTH = 60;
  const GAP_SIZE = 180;

  // Mutable game state
  const gameRef = useRef({
    bird: { y: 200, velocity: 0, radius: 15 },
    pipes: [],
    frameCount: 0,
    score: 0,
    animationId: null,
  });

  // Handle Blinks
  useEffect(() => {
    if (lastBlinkTime > 0) {
      if (gameState === 'playing') {
        gameRef.current.bird.velocity = JUMP_STRENGTH;
      } else if (gameState === 'idle' || gameState === 'gameover') {
        startGame();
      }
    }
  }, [lastBlinkTime]);

  const startGame = () => {
    gameRef.current = {
      bird: { y: 200, velocity: 0, radius: 15 },
      pipes: [],
      frameCount: 0,
      score: 0,
      animationId: null,
    };
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndDraw = () => {
      const state = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background grid
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }

      if (gameState === 'playing') {
        // Update bird
        state.bird.velocity += GRAVITY;
        state.bird.y += state.bird.velocity;

        // Spawn pipes
        if (state.frameCount % PIPE_SPAWN_RATE === 0) {
          const minPipeHeight = 50;
          const maxPipeHeight = height - GAP_SIZE - minPipeHeight;
          const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
          
          state.pipes.push({
            x: width,
            topHeight: topPipeHeight,
            passed: false,
          });
        }

        // Update pipes
        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const pipe = state.pipes[i];
          pipe.x -= PIPE_SPEED;

          // Collision detection
          const birdX = 100; // Fixed bird X position
          const birdRight = birdX + state.bird.radius;
          const birdLeft = birdX - state.bird.radius;
          const birdTop = state.bird.y - state.bird.radius;
          const birdBottom = state.bird.y + state.bird.radius;

          if (
            birdRight > pipe.x && 
            birdLeft < pipe.x + PIPE_WIDTH
          ) {
            if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + GAP_SIZE) {
              setGameState('gameover');
            }
          }

          // Score update
          if (pipe.x + PIPE_WIDTH < birdLeft && !pipe.passed) {
            pipe.passed = true;
            state.score += 1;
            setScore(state.score);
          }

          // Remove off-screen pipes
          if (pipe.x + PIPE_WIDTH < 0) {
            state.pipes.splice(i, 1);
          }
        }

        // Floor / Ceiling collision
        if (state.bird.y + state.bird.radius > height || state.bird.y - state.bird.radius < 0) {
          setGameState('gameover');
        }

        state.frameCount++;
      }

      // Draw Pipes
      ctx.fillStyle = '#000';
      state.pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.topHeight + GAP_SIZE, PIPE_WIDTH, height - pipe.topHeight - GAP_SIZE);
      });

      // Draw Bird
      ctx.beginPath();
      ctx.arc(100, state.bird.y, state.bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = gameState === 'gameover' ? '#ef4444' : '#10b981';
      ctx.fill();
      ctx.closePath();

      if (gameState === 'idle') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Blink to Start', width / 2, height / 2);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2 - 20);
        ctx.font = '20px sans-serif';
        ctx.fillText(`Score: ${state.score}`, width / 2, height / 2 + 20);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('Blink to Restart', width / 2, height / 2 + 60);
      }

      state.animationId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, [gameState]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Focus & Blink</h2>
          <p className="text-sm text-gray-500">Gravity pulls you down. Blink to jump.</p>
        </div>
        <div className="text-4xl font-black tabular-nums">{score}</div>
      </div>
      
      <div className="w-full h-[500px] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm relative">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-cover" />
        
        {!isStreaming && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-gray-800">Start the stream to play</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
