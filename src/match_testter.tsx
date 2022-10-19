/*
 * Copyright 2018 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import { DurerXVIRelayClient } from './components/ReactClient';


class MatchTest extends React.Component{

  state = {
    matchID: '',
    credential: '',
    nameErrorMsg: '',
    allowed: false,
  };

  render() {
    return (
      <div>
        <p className="phase-title">Set params:</p>
        <input
          type="text"
          value={this.state.matchID}
          onChange={this.onChangeMatchId} />
        <input
          type="text"
          value={this.state.credential}
          onChange={this.onChangeCredentials} />
        <span className="buttons">
          <button className="buttons" onClick={this.onClickEnter}>
            Enter
          </button>
        </span>
        <br />
        <span className="error-msg">
          {this.state.nameErrorMsg}
          <br />
        </span>
        <DurerXVIRelayClient category='C' 
        matchID={
          this.state.matchID!}
        credentials={
            this.state.credential!}></DurerXVIRelayClient>
      </div>

    );
  }
  onClickEnter = () => {
    if (this.state.matchID === '' || this.state.credential === '') return;
    this.state.allowed = true;
  };

  
  onChangeMatchId = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value.trim();
    this.setState({
      matchID: name,
      nameErrorMsg: name.length > 0 ? '' : 'empty matchid',
    });
  };
  onChangeCredentials = (event: React.ChangeEvent<HTMLInputElement>) => {
    const credential = event.target.value.trim();
    this.setState({
      creadential: credential,
      nameErrorMsg: credential.length > 0 ? '' : 'empty credential',
    });
  };
}

export default MatchTest;
