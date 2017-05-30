import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';
import moment from 'moment';
import classNames from 'classnames';

// All inputs and outputs are Moment objects
class TimeInput extends Component {
  constructor(props) {
    super(props);

    this.state = { valid: true };

    this.onChange = this.onChange.bind(this);
  }

  render() {
    const { format, value, className } = this.props;
    const formatted = value.format(format);
    const inputClass = classNames('input-group', this.state.valid ? 'has-success' : 'has-error');

    return (
      <div className={inputClass}>
        <input
          type="text"
          className={className}
          defaultValue={formatted}
          onChange={this.onChange} />
        <div className="input-group-addon">
          <Glyphicon glyph="calendar" />
        </div>
      </div>
    );
  }

  onChange(e) {
    const value = e.target.value;
    const parsed = moment(value);
    const valid = parsed.format(this.props.format) === value;

    this.setState({ valid });

    if (valid) {
      this.props.onChange(parsed);
    }
  }
}

TimeInput.propTypes = {
  format: React.PropTypes.string.isRequired,
  value: React.PropTypes.object.isRequired,
  onChange: React.PropTypes.func
};

export default TimeInput;
