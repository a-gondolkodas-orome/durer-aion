'use strict';

import { random } from 'lodash-es'

exports.generateRandomEvenBetween = (low, high) => {
  return 2 * random(Math.ceil(low / 2), Math.floor(high / 2));
}
