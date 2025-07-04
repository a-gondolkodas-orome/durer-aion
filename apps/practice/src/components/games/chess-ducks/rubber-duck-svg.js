import React from 'react';

export const DuckSvg = () => {
  return (
    <svg style={{ display: 'none' }}>
      <symbol id="game-duck" viewBox="0 0 200 200">
        {/*<!-- Duck body -->*/}
        <ellipse cx="100" cy="130" rx="70" ry="40" fill="#ffdd00" stroke="#e6c200" strokeWidth="2"/>

        {/*<!-- Duck head -->*/}
        <circle cx="130" cy="80" r="28" fill="#ffdd00" stroke="#e6c200" strokeWidth="2"/>

        {/*<!-- Duck wing -->*/}
        <ellipse cx="85" cy="120" rx="25" ry="12" fill="#f0c814" stroke="#d4b012" strokeWidth="2"/>

        {/*<!-- Duck tail -->*/}
        <path d="M 35 115 C 20 105, 15 115, 22 130 C 28 140, 40 138, 42 125 Z"
              fill="#ffdd00" stroke="#e6c200" strokeWidth="2"/>

        {/*<!-- Duck beak -->*/}
        <ellipse cx="160" cy="85" rx="15" ry="8" fill="#ffa500" stroke="#e6940a" strokeWidth="1"/>

        {/*<!-- Duck eye -->*/}
        <circle cx="135" cy="72" r="4" fill="#333"/>

        {/*<!-- Duck legs -->*/}
        <g stroke="#333" strokeWidth="3" fill="none">
          {/*<!-- Left leg -->*/}
          <line x1="90" y1="165" x2="90" y2="175"/>
          <path d="M 85 175 L 90 175 L 95 175 M 85 178 L 90 175 L 95 178" strokeWidth="2"/>

          {/*<!-- Right leg -->*/}
          <line x1="110" y1="165" x2="110" y2="175"/>
          <path d="M 105 175 L 110 175 L 115 175 M 105 178 L 110 175 L 115 178" strokeWidth="2"/>
        </g>
      </symbol>
    </svg>
  );
};
