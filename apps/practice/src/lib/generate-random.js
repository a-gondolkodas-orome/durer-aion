'use strict';

exports.generateRandomIntBetween = function(low, high) {
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

exports.generateRandomEvenBetween = function(low, high) {
  return 2 * exports.generateRandomIntBetween(Math.ceil(low / 2), Math.floor(high / 2));
}