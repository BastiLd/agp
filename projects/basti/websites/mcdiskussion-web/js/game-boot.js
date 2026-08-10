// Boots the standalone Paddle Force page.
import { initPaddleForce } from './paddleforce.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPaddleForce);
} else {
  initPaddleForce();
}
