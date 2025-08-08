export const checkAuth = (toastRef, navigate) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    toastRef.current?.showWarn('Please login to access this feature.');
    navigate('/login');
    return null;
  }
  return user;
};
