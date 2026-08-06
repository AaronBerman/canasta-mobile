import { AIDifficulty } from '../core/game-state.js';
import { AIStrategy } from './easy-strategy.js';
import { EasyStrategy } from './easy-strategy.js';
import { MediumStrategy } from './medium-strategy.js';
import { HardStrategy } from './hard-strategy.js';

export function createAIStrategy(difficulty: AIDifficulty): AIStrategy {
  switch (difficulty) {
    case 'easy':
      return new EasyStrategy();
    case 'medium':
      return new MediumStrategy();
    case 'hard':
      return new HardStrategy();
  }
}

export class AIPlayer {
  constructor(
    public readonly seatIndex: number,
    public readonly difficulty: AIDifficulty,
    private strategy: AIStrategy = createAIStrategy(difficulty),
  ) {}

  setDifficulty(difficulty: AIDifficulty): void {
    this.strategy = createAIStrategy(difficulty);
  }

  getStrategy(): AIStrategy {
    return this.strategy;
  }
}

export { EasyStrategy, MediumStrategy, HardStrategy };
export type { AIStrategy, AIAction } from './easy-strategy.js';
export { CardCounter } from './card-counter.js';
