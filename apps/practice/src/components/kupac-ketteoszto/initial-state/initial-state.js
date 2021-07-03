'use strict';

export const generateNewBoard = function() {
  return [generateRandomIntBetween(3, 6), generateRandomIntBetween(3, 6)];
};

const generateRandomIntBetween = function(low, high) {
  return Math.floor(Math.random() * (high - low + 1)) + low;
};
