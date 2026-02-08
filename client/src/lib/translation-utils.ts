// Helper function to check if a translation value should be rendered
// Returns true only if value exists, is a non-empty string after trimming
export const shouldRender = (value: any): boolean => {
  return value && typeof value === 'string' && value.trim().length > 0;
};
