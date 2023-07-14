'use strict';

import { random } from 'lodash';

export const getOptimalAiStep = ({ left, right }) => {
  let dst = right-left;
  if(dst === 1) return 2;
  if(dst === 2) return 1;
  if(dst % 3 === 2) return random(1,2);
  return (dst+1) % 3;
};
