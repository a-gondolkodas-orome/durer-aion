export const formatTime = (time: Date): string => {
  if (!time.getHours) {
    time = new Date(time);
  }
  return `${time.getHours() < 10 ? "0" : ""}${time.getHours()}:${time.getMinutes() < 10 ? "0" : ""}${time.getMinutes()}`;
}
