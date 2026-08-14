export function calculateStreak(lastActiveAt, currentStreak, longestStreak, now = new Date()) {
  let newCurrent = currentStreak || 0;
  let newLongest = longestStreak || 0;

  if (lastActiveAt) {
    // Zero out hours to only compare days
    const lastActive = new Date(lastActiveAt);
    const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowDate.getTime() - lastActiveDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      // Active yesterday, increment
      newCurrent += 1;
    } else if (diffDays > 1) {
      // Missed a day, reset
      newCurrent = 1;
    }
  } else {
    // First activity
    newCurrent = 1;
  }

  newLongest = Math.max(newLongest, newCurrent);

  return { currentStreak: newCurrent, longestStreak: newLongest };
}
