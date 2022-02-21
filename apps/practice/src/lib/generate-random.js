'use strict';

exports.generateRandomIntBetween = (low, high) => {
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

exports.generateRandomEvenBetween = (low, high) => {
  return 2 * exports.generateRandomIntBetween(Math.ceil(low / 2), Math.floor(high / 2));
}