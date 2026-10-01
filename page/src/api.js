// MOS API helpers (bearer token of the logged-in user).
export const authHeaders = () => ({
  Authorization: 'Bearer ' + localStorage.getItem('authToken'),
});

export const getJson = async (url) => {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const err = new Error(`${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};
