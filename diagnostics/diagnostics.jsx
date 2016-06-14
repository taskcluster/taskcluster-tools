var React       = require('react');
var retrieve    = require('./retrieve.js');
var _           = require('lodash');
var bs          = require('react-bootstrap');

const SERVICE_STYLE = {
	backgroundColor: "#e3e3e3",
	margin: "10px",
	padding: "10px"
}

var Service = React.createClass ({
  render: function () {
    return <bs.Col style={SERVICE_STYLE} >
      <p><b>{this.props.title}</b></p>
      {(this.props.test.pass.length)? this.showPassing() : ''}
      {(this.props.test.fail.length)? this.showFailing() : ''}
      </bs.Col>
  },

  showPassing: function(){
    return <div> 
      <p>Passing: </p>
      <ul className="container-fluid pass">
       {
          this.props.test.pass.map(res => {
            return <li>{res}</li>
          })
       }
      </ul>
    </div>
  },

  showFailing: function(){
    return <div> 
      <p>Failing: </p>
      <ul>
        {
          this.props.test.fail.map(res => <li>{res}</li>)
        }
      </ul>
    </div>
  }
});

var Diagnostics = React.createClass({
  getInitialState: () => {
    return {
      testResult: {},
      testId:'',
      error: null,
      rawLog: ''
    };
  },

  componentWillMount: function() {
    var that = this;
    retrieve.getLatestLog('production','JSON').then(res => {
      let jsonres = retrieve.parseResult(JSON.parse(res.log));
      that.setState({
        testDate: res.testDate,
        testId: res.testId,
        testResult: jsonres
      });
    });
    retrieve.getLatestLog('production','RAW').then(res => {
      var rawLog = (res.log).replace(/\\n/g,"\n")
        .replace(/\\"/g,'"')
        .replace(/\\r/g,"\n")
        .replace(/\\/,"");
      that.setState({
        rawLog
      });
    })
  },

  render:function () {
    return <bs.Grid>
      <h3>TestId: {this.state.testId}</h3>
      <h3>Date: {this.state.testDate}</h3> 
      <bs.Row>
        {
          _.keys(this.state.testResult).map(service => {
            return <Service key={service} title={service} test={this.state.testResult[service]}/>
          })
        }
      </bs.Row>
      <h3>Logs: </h3>
      <p>{this.state.rawLog}</p>
    </bs.Grid>  
  }

});

module.exports = Diagnostics;

