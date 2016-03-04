var React            = require('react');
var bs               = require('react-bootstrap');
var moment           = require('moment');
var classNames       = require('classnames');

// All inputs and outputs are Moment objects
module.exports = React.createClass({
  propTypes: {
    format:   React.PropTypes.string.isRequired,
    value:    React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func,
  },

  getInitialState() {
    return {
      valid: true,
    }
  },

  render() {
    let {format, value, onChange, ...props} = this.props;

    let formatted = value.format(format);
    return <div className={classNames("input-group", 
                            this.state.valid? 'has-success' : 'has-error')}>
             <input type="string"
                    defaultValue={formatted}
                    onChange={this.onChange}
                    hasFeedback
                    {...props}/>
             <div className="input-group-addon">
               <bs.Glyphicon glyph="calendar"/>
             </div>
           </div>
  },

  onChange(e) {
    let value = e.target.value;
    let parsed = moment(value);
    let valid = parsed.format(this.props.format) === value;
    this.setState({valid});
    if (valid) {
      this.props.onChange(parsed);
    }
  }
});
