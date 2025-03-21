export const isOfflineMode = (): boolean => {
  return process.env.REACT_APP_WHICH_VERSION === "b";
};

export const isOnlineMode = (): boolean => {
  return !isOfflineMode();
};
