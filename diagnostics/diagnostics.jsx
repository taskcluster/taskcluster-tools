import React from 'react';
import _ from 'lodash';
import Service from './service.jsx';
import Retrieve from './retrieve';
import { Grid, Row } from 'react-bootstrap';

export default class Diagnostics extends React.Component {

  constructor (props) {
    super(props);
    
    this.state = {
      jsonLog:  '',
      rawLog:   '',
      testId:   '',
      testDate: ''
    }
  }

  async componentWillMount () {
    let res = await Retrieve.getLatestLog('production', 'JSON');
    let jsonLog = Retrieve.parseResult(JSON.parse(res.log));
    let testId = res.testId;
    let testDate = res.testDate;

    this.setState({
      jsonLog,
      testId,
      testDate
    });

    res = await Retrieve.getLatestLog('production', 'RAW');
    let rawLog = res.log.replace(/\\n/g,'\n')
      .replace(/\\"/g,'"')
      .replace(/\\r/g,'\n')
      .replace(/\\/g, '');

    this.setState({ rawLog });
  }

  render () {
    return <Grid> 
      <h4>Date: {this.state.testDate}</h4>
      <h4>TestId: {this.state.testId}</h4>
      <Row>
        {
          _.keys(this.state.jsonLog).map(s => <Service key={s} title={s} test={this.state.jsonLog[s]} />)
        }
      </Row>
      <h3>Log: </h3>
      <RawLog text={this.state.rawLog} />
    </Grid>
  }
}

const RawLog = props => {
  return <div className="log">
    {
      props.text.split('\n').map(l =>{
        if(l.indexOf("\u2713") != -1)
          return <p className="success">{l}</p>
        return <p className="message">{l}</p>
      })
    }
  </div>
} 
