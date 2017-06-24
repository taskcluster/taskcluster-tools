import React from 'react';
import { string, object, func } from 'prop-types';
import { Glyphicon } from 'react-bootstrap';
import moment from 'moment';
import classNames from 'classnames';

export default class TimeInput extends React.PureComponent {
  static propTypes = {
    format: string.isRequired,
    value: object.isRequired,
    onChange: func
  };
  
  constructor(props) {
    super(props);

    this.state = { valid: true };
  }

  onChange = (e) => {
    const parsed = moment(e.target.value);
    const valid = parsed.format(this.props.format) === e.target.value;

    this.setState({ valid });

    if (valid) {
      this.props.onChange(parsed);
    }
  };

  render() {
    const { format, value, className } = this.props;
    const { valid } = this.state;
    const formatted = value.format(format);
    const inputClass = classNames('input-group', valid ? 'has-success' : 'has-error');

    return (
      <div className={inputClass}>
        <input type="text" className={className} defaultValue={formatted} onChange={this.onChange} />
        <div className="input-group-addon">
          <Glyphicon glyph="calendar" />
        </div>
      </div>
    );
  }
}
