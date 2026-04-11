export const POST_DAYS_KEY = (id: string) => `ascend_dev_postdays_${id}`;
export const HABITS_TUTORIAL_KEY = "ascend_habits_tutorial_done";

export function getPostOnboardingDays(playerId: string): number {
  return parseInt(localStorage.getItem(POST_DAYS_KEY(playerId)) || "0", 10);
}

export function getDisplayDay(
  playerId: string,
  onboardingDay: number,
  isComplete: boolean
): number {
  if (!isComplete) return onboardingDay;
  return 6 + getPostOnboardingDays(playerId);
}

export function isHabitsTutorialDone(): boolean {
  return localStorage.getItem(HABITS_TUTORIAL_KEY) === "true";
}

export function markHabitsTutorialDone(): void {
  localStorage.setItem(HABITS_TUTORIAL_KEY, "true");
  window.dispatchEvent(new CustomEvent("ascend:habits-tutorial-done"));
}
