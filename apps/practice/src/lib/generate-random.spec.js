'use strict';

import * as random from 'lodash-es/random';
import { generateRandomEvenBetween } from './generate-random';

describe('generate random', () => {
  describe('generateRandomEvenBetween', () => {
    it.each([
      [0, 0],
      [1, 2]
    ])('should return an even number from the [0, 2] interval randomly', (randomInt, expected) => {
      const randomSpy = jest.spyOn(random, 'default').mockImplementationOnce(() => randomInt);
      expect(generateRandomEvenBetween(0, 2)).toEqual(expected);
      expect(randomSpy).toHaveBeenCalledWith(0, 1);
    });

    it.each([
      [2, 4],
      [3, 6],
      [4, 8]
    ])('should return an even number from the [3, 9] interval randomly', (randomInt, expected) => {
      const randomSpy = jest.spyOn(random, 'default').mockImplementationOnce(() => randomInt);
      expect(generateRandomEvenBetween(3, 9)).toEqual(expected);
      expect(randomSpy).toHaveBeenCalledWith(2, 4);
    });

    it('should return single even number in interval', () => {
      const randomSpy = jest.spyOn(random, 'default');
      expect(generateRandomEvenBetween(1, 3)).toEqual(2);
      expect(randomSpy).toHaveBeenCalledWith(1, 1);
    });
  });
});
