/*
 * Copyright 2018 The boardgame.io Authors.
 *
 * Use of this source code is governed by a MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
 */

import React from 'react';
import { DurerXVIRelayClient } from './components/ReactClient';

type LoginFormProps = {
  matchID?: string;
  credential?:string;
  onEnter: (playerName?: string,credential?:string) => void;
};

type LoginFormState = {
  matchID?: string;
  creadential?: string;
  nameErrorMsg: string;
};

class MatchTest extends React.Component<LoginFormProps, LoginFormState> {
  static defaultProps = {
    playerName: '',
  };

  state = {
    matchID: this.props.matchID,
    credential:this.props.credential,
    nameErrorMsg: '',
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
          value={this.state.matchID}
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
        
      </div>
    );
  }

  /*
  <DurerXVIRelayClient category='C' 
        matchID={
          this.state.matchID!}
        credentials={
            this.state.credential!}>
            </DurerXVIRelayClient>
  */
  onClickEnter = () => {
    if (this.state.matchID === '') return;
    this.props.onEnter(this.state.matchID,this.state.credential);
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
