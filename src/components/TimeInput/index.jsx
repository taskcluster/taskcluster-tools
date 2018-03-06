import { PureComponent } from 'react';
import { object, func } from 'prop-types';
import { Glyphicon } from 'react-bootstrap';
import classNames from 'classnames';

export default class TimeInput extends PureComponent {
  static propTypes = {
    value: object.isRequired,
    onChange: func
  };

  constructor(props) {
    super(props);

    this.state = { valid: true };
  }

  handleChange = e => {
    const parsed = new Date(e.target.value);
    const valid = parsed.toJSON() === e.target.value;

    this.setState({ valid });

    if (valid) {
      this.props.onChange(parsed);
    }
  };

  render() {
    const { value, className } = this.props;
    const { valid } = this.state;
    const formatted = value.toJSON();
    const inputClass = classNames(
      'input-group',
      valid ? 'has-success' : 'has-error'
    );

    return (
      <div className={inputClass}>
        <input
          type="text"
          className={className}
          defaultValue={formatted}
          onChange={this.handleChange}
        />
        <div className="input-group-addon">
          <Glyphicon glyph="calendar" />
        </div>
      </div>
    );
  }
}
