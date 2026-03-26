export const getPodiumGradient = (position: number): string => {
  if (position === 1)
    return 'linear-gradient(to bottom, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)';
  if (position === 2)
    return 'linear-gradient(to bottom, #9ca3af, #f3f4f6, #6b7280, #e5e7eb, #4b5563)';
  if (position === 3)
    return 'linear-gradient(to bottom, #804A00, #EDC9AF, #A0522D, #D2691E, #5E2612)';
  return '';
};