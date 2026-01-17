# Abyssal Hunter: Evolution

A browser-based arcade game where you control a deep-sea creature evolving through the abyss.

## Features

- 🎮 Smooth physics-based tentacle controls
- 🌊 Dynamic ocean environment with parallax stars
- 🐟 AI-driven creatures with unique behaviors
- 🎵 Procedurally generated sound effects
- ⚡ Dash ability with ink/energy management
- 📊 Evolution system with rank progression
- 🎯 Combo multiplier system
- ✨ Particle effects and visual polish

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development Workflow

This project includes a comprehensive workflow system for safe, high-quality development.

### Natural Language Coding

Use the orchestrator to code in natural language:

```bash
# Add new features
npm run orchestrator:execute "add a new enemy type"

# Fix bugs
npm run orchestrator:execute "fix collision detection"

# Refactor code
npm run orchestrator:execute "optimize rendering performance"
```

### Manual Development

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview build

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Lint code
npm run lint:fix        # Fix linting issues
npm run format          # Format code
npm run type-check      # TypeScript check
npm run validate        # Run all checks
```

## Documentation

- [Workflow Guide](WORKFLOW_GUIDE.md) - Complete workflow and development guide
- Pre-commit hooks automatically lint, format, and test your code
- CI/CD pipeline ensures code quality on every push

## Architecture

- **React + TypeScript**: UI framework with strict type safety
- **Vite**: Fast build tool and dev server
- **Vitest**: Unit testing framework
- **Playwright**: E2E testing
- **ESLint + Prettier**: Code quality and formatting
- **Husky + lint-staged**: Pre-commit quality checks

### Project Structure

```
src/
├── components/        # React UI components
│   └── Game.tsx      # Main game component
├── game/             # Game engine (pure TypeScript)
│   ├── GameEngine.ts # Core game loop
│   ├── Player.ts     # Player entity
│   ├── Entity.ts     # AI entities
│   ├── AudioManager.ts   # Sound system
│   └── ...          # Other game systems
├── styles/          # CSS
└── test/            # Test utilities
```

## Game Controls

- **WASD / Arrow Keys**: Move player
- **Mouse / Touch**: Point to move direction
- **Space / Click**: Dash ability
- **M**: Toggle mute

## Evolution Ranks

1. Larva (0)
2. Scavenger (30)
3. Hunter (60)
4. Apex Predator (100)
5. Leviathan (150)
6. KRAKEN (220)
7. COSMIC HORROR (350)

## Technology Stack

- React 18
- TypeScript 5.6 (strict mode)
- Vite 7.3
- Vitest + Playwright
- ESLint + Prettier
- Web Audio API
- Canvas 2D

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the [Workflow Guide](WORKFLOW_GUIDE.md)
4. Ensure all tests pass
5. Submit a pull request

## License

Private project - All rights reserved
