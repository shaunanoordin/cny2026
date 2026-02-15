/*
How Many Cars to Spawn?
Determines how many cars to spawn every second.

- The higher your score, the more cars are spawned.
  - When score is 0, no cars are spawned.
- Used by CNY2026GameManager.
 */

export default function howManyCarsToSpawn (score = 0) {
  if (score >= 2000) return 5
  if (score >= 1500) return 4
  if (score >= 1000) return 3
  if (score >= 500) return 2
  if (score >= 100) return 1
  return 0
}