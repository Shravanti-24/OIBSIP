export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => d.message).join(' ');
  }
  if (data?.message) {
    return data.message;
  }
  if (error?.message === 'Network Error') {
    return 'Could not reach the server. Please check your connection and try again.';
  }
  return fallback;
}
