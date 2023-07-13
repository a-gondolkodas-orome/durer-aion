'use strict';

import { random } from 'lodash';

export const getOptimalAiStep = ({ left, right }) => {
  let offset = (right - left) % 3;
  if (offset === 0) {
    return randomStep();
  }
  return offset;
};

const randomStep = () => {
  return random(1, 2);
};
