export function points(guess, answer, sport) {
 if (!Number.isFinite(guess) || guess < 0) return 0;
 if (guess === answer) return 1000;
 const relativeError = Math.abs(guess - answer) / answer;
 const penalty = sport === 'MLB' ? 1250 : 1500;
 return Math.max(1, Math.min(999, Math.round(1000 - penalty * relativeError)));
}
