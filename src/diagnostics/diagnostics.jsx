import React from 'react';
import _ from 'lodash';
import Service from './service';
import retrieve from './retrieve';
import { Grid, Row, Button } from 'react-bootstrap';
import './diagnostics.less';

const RawLog = props => (
  <div>
    <h3>Log: </h3>
    <div className="log">
      {
        props.text
          .split('\n')
          .map((l, key) => l.includes('\u2713') ?
            <p key={key} className="success">{l}</p> :
            <p key={key} className="message">{l}</p>
          )
      }
    </div>
  </div>
);

export default class Diagnostics extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      jsonLog: {},
      rawLog: '',
      testId: '',
      testDate: '',
      showRawLog: false
    };

    this.toggleShow = this.toggleShow.bind(this);
  }

  async componentWillMount() {
    const prodJSON = await retrieve.getLatestLog('production', 'JSON');
    const jsonLog = retrieve.parseResult(JSON.parse(prodJSON.log));
    const testId = prodJSON.testId;
    const testDate = prodJSON.testDate;

    this.setState({
      jsonLog,
      testId,
      testDate
    });

    const prodRaw = await retrieve.getLatestLog('production', 'RAW');
    const rawLog = prodRaw.log.replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\r/g, '\n')
      .replace(/\\/g, '');

    this.setState({ rawLog });
  }

  render() {
    return (
      <Grid fluid={true}>
        <h4>Date: {this.state.testDate}</h4>
        <h4>TestId: {this.state.testId}</h4>
        <Row>
          {
            _.keys(this.state.jsonLog)
            .map(s => <Service key={s} title={s} test={this.state.jsonLog[s]} />)
          }
        </Row>
        <Button onClick={this.toggleShow} bsStyle="primary" bsSize="small">Show Log</Button>
        {
          this.state.showRawLog ?
            <RawLog text={this.state.rawLog} /> :
            ''
        }
      </Grid>
    );
  }

  toggleShow() {
    this.setState({ showRawLog: !this.state.showRawLog });
  }
}
