export const interceptProfile = () => {
  const hasProfile = localStorage.profile ? JSON.parse(localStorage.profile) : false
  if (!hasProfile && location.pathname !== '/profile') history.pushState(null, '', '/profile')
}
