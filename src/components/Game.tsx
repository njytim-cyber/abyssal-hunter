import { useRef, useEffect, useCallback, useState, memo, type ReactNode } from 'react';

import { GameEngine, Level, LEVELS, CONFIG } from '../game';
import { shopManager } from '../game/ShopManager';

import { ShopScreen } from './ShopScreen';

interface HUDProps {
  score: number;
  rank: string;
  inkPercent: number;
  combo: number;
  comboMultiplier: number;
  muted: boolean;
  onMuteToggle: () => void;
}

/**
 * HUD component - memoized to prevent unnecessary re-renders
 */
const HUD = memo(function HUD({
  score,
  rank,
  inkPercent,
  combo,
  comboMultiplier,
  muted,
  onMuteToggle,
}: HUDProps) {
  return (
    <div className="hud">
      <h1>Abyssal Hunter</h1>
      <div className="stat">
        MASS: <span id="score">{score}</span>
      </div>
      <div className="stat rank-display">
        RANK: <span id="rank">{rank}</span>
      </div>
      <div className="bar-container">
        <div
          className="ink-bar"
          style={{
            width: `${inkPercent}%`,
            background: inkPercent > 20 ? CONFIG.colors.ink : '#ff4444',
          }}
        />
      </div>
      {combo > 1 && (
        <div className="combo-display">
          <span className="combo-count">x{comboMultiplier}</span>
          <span className="combo-label">COMBO</span>
        </div>
      )}
      <button className="mute-btn" onClick={onMuteToggle} aria-label={muted ? 'Unmute' : 'Mute'}>
        {muted ? '🔇' : '🔊'}
      </button>
      <div className="controls-hint">
        WASD/Arrows to move • Space/Click to dash • ESC/P to pause
      </div>
    </div>
  );
});

interface NotificationProps {
  title: string;
  visible: boolean;
}

/**
 * Level up notification with animation
 */
const Notification = memo(function Notification({ title, visible }: NotificationProps) {
  return (
    <div className={`notification ${visible ? 'active' : ''}`}>
      <h2>Evolved</h2>
      <div className="rank">{title}</div>
    </div>
  );
});

interface ScreenProps {
  visible: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Base screen overlay component
 */
function Screen({ visible, children, className = '' }: ScreenProps) {
  return <div className={`screen ${visible ? 'visible' : ''} ${className}`}>{children}</div>;
}

interface StartScreenProps {
  visible: boolean;
  onStart: () => void;
}

/**
 * Initial start screen with animated tentacles
 */
const StartScreen = memo(function StartScreen({ visible, onStart }: StartScreenProps) {
  return (
    <Screen visible={visible}>
      <div className="start-bg">
        {/* Animated tentacles */}
        <div className="tentacle tentacle-1"></div>
        <div className="tentacle tentacle-2"></div>
        <div className="tentacle tentacle-3"></div>
        <div className="tentacle tentacle-4"></div>
        {/* Floating particles */}
        <div className="particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>
      <h2 className="title glow-pulse">Abyssal Hunter</h2>
      <p className="desc">
        Start as a larva. Eat to evolve.
        <br />
        Become the <strong>KRAKEN</strong>.<br />
        <span className="controls-text">WASD/Arrows to move • Space/Click to dash</span>
      </p>
      <button onClick={onStart}>Dive In</button>
    </Screen>
  );
});

interface GameOverScreenProps {
  visible: boolean;
  finalScore: number;
  coinsEarned: number;
  totalCoins: number;
  onRestart: () => void;
  onShop: () => void;
}

/**
 * Game over screen with final score
 */
const GameOverScreen = memo(function GameOverScreen({
  visible,
  finalScore,
  coinsEarned,
  totalCoins,
  onRestart,
  onShop,
}: GameOverScreenProps) {
  return (
    <Screen visible={visible} className="game-over">
      <h2 className="title game-over-title">Consumed</h2>
      <p className="desc">
        You returned to the depths.
        <br />
        Final Mass: <span>{finalScore}</span>
      </p>
      <div className="coins-earned">
        <span className="coin-icon">🪙</span> +{coinsEarned} coins
        <div className="total-coins">Total: {totalCoins}</div>
      </div>
      <div className="game-over-buttons">
        <button onClick={onShop} className="shop-button">
          Shop
        </button>
        <button onClick={onRestart}>Respawn</button>
      </div>
    </Screen>
  );
});

interface PauseScreenProps {
  visible: boolean;
}

/**
 * Pause screen overlay
 */
const PauseScreen = memo(function PauseScreen({ visible }: PauseScreenProps) {
  return (
    <Screen visible={visible} className="pause-screen">
      <h2 className="title">PAUSED</h2>
      <p className="desc">
        Press <strong>ESC</strong> or <strong>P</strong> to resume
      </p>
    </Screen>
  );
});

type GameState = 'start' | 'playing' | 'gameover';

/**
 * Main Game component - orchestrates the game engine and React UI
 * Separates game loop (60fps canvas) from React state updates (on-demand)
 */
export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI State - updated only when game events occur
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState(LEVELS[0].rank);
  const [inkPercent, setInkPercent] = useState(100);
  const [finalScore, setFinalScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  // Shop state
  const [shopVisible, setShopVisible] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  // Notification state
  const [notification, setNotification] = useState({ title: '', visible: false });
  const notificationTimeout = useRef<number>(0);

  /**
   * Show level up notification with auto-hide
   */
  const showNotification = useCallback((level: Level) => {
    // Clear existing timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }

    setRank(level.rank);
    setNotification({ title: level.rank, visible: true });

    notificationTimeout.current = window.setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  /**
   * Handle mute toggle
   */
  const handleMuteToggle = useCallback(() => {
    const newMuted = engineRef.current?.toggleMute() ?? false;
    setMuted(newMuted);
  }, []);

  /**
   * Initialize game engine
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine();
    engineRef.current = engine;

    engine.init(canvasRef.current, {
      onScoreChange: setScore,
      onLevelUp: showNotification,
      onInkChange: (ink, maxInk) => setInkPercent((ink / maxInk) * 100),
      onGameOver: score => {
        setFinalScore(score);
        setGameState('gameover');
        // Calculate coins earned (already added by GameEngine, just display it)
        const earned = Math.max(0, score - CONFIG.player.startRadius);
        setCoinsEarned(earned);
        setTotalCoins(shopManager.getCoins());
      },
      onComboChange: (count, multiplier) => {
        setCombo(count);
        setComboMultiplier(multiplier);
      },
    });

    // Handle resize
    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
    };
  }, [showNotification]);

  /**
   * Input handling - attached to window for consistent behavior
   */
  useEffect(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    // Mouse handlers
    const handleMouseMove = (e: MouseEvent) => {
      engine.setInputPosition(e.clientX, e.clientY);
    };

    const handleMouseDown = () => engine.setInputActive(true);
    const handleMouseUp = () => engine.setInputActive(false);

    // Touch handlers with passive: false for preventDefault
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
        engine.setInputPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
        engine.setInputActive(true);
        engine.setInputPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.target === canvas) {
        engine.setInputActive(false);
      }
    };

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      engine.setKeyState(e.code, true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.setKeyState(e.code, false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /**
   * Poll pause state from engine
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current && gameState === 'playing') {
        setPaused(engineRef.current.isPaused());
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [gameState]);

  /**
   * Start or restart the game
   */
  const startGame = useCallback(() => {
    setGameState('playing');
    setRank(LEVELS[0].rank);
    setCombo(0);
    setComboMultiplier(1);
    setShopVisible(false); // Close shop when starting game
    engineRef.current?.start();
  }, []);

  /**
   * Open shop screen
   */
  const handleShop = useCallback(() => {
    setShopVisible(true);
  }, []);

  /**
   * Close shop screen
   */
  const handleCloseShop = useCallback(() => {
    setShopVisible(false);
    // Refresh total coins in case of purchases
    setTotalCoins(shopManager.getCoins());
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="gameCanvas" />

      <div id="ui-layer">
        <HUD
          score={score}
          rank={rank}
          inkPercent={inkPercent}
          combo={combo}
          comboMultiplier={comboMultiplier}
          muted={muted}
          onMuteToggle={handleMuteToggle}
        />
        <Notification title={notification.title} visible={notification.visible} />
      </div>

      <StartScreen visible={gameState === 'start'} onStart={startGame} />
      <GameOverScreen
        visible={gameState === 'gameover' && !shopVisible}
        finalScore={finalScore}
        coinsEarned={coinsEarned}
        totalCoins={totalCoins}
        onRestart={startGame}
        onShop={handleShop}
      />
      <PauseScreen visible={paused && gameState === 'playing'} />
      <ShopScreen visible={shopVisible} onClose={handleCloseShop} />
    </>
  );
}
