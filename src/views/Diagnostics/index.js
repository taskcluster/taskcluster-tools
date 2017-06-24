import React from 'react';
import { Grid, Row, Button } from 'react-bootstrap';
import Service from './Service';
import RawLog from './RawLog';
import retrieve from './retrieve';

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

  toggleShow = () => this.setState({ showRawLog: !this.state.showRawLog });

  render() {
    return (
      <Grid fluid={true}>
        <h4>Date: {this.state.testDate}</h4>
        <h4>TestId: {this.state.testId}</h4>
        <Row>
          {Object.entries(this.state.jsonLog).map(([key, value]) => <Service key={key} title={key} test={value} />)}
        </Row>
        <Button onClick={this.toggleShow} bsStyle="primary" bsSize="small">Show Log</Button>
        {this.state.showRawLog && <RawLog text={this.state.rawLog} />}
      </Grid>
    );
  }
}
