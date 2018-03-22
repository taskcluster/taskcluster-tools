import { PureComponent } from 'react';
import { oneOfType, instanceOf, string, oneOf } from 'prop-types';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import { v4 } from 'slugid';

export default class DateView extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      didCopy: false,
      id: v4()
    };
  }

  registerChild = ref => {
    this.textareaRef = ref;
  };

  handleMouseLeave = () => {
    if (this.state.didCopy) {
      this.setState({ didCopy: false });
    }
  };

  handleCopyToClipboard = () => {
    const textarea = this.textareaRef;

    textarea.select();
    document.execCommand('copy');
    this.setState({ didCopy: true });
  };

  render() {
    const { date, since, placement } = this.props;
    const tooltip = (
      <Tooltip id={this.state.id}>
        {moment(date).toISOString()}
        <br />
        {this.state.didCopy ? '(Copied!)' : '(Click to copy)'}
      </Tooltip>
    );

    return (
      <OverlayTrigger placement={placement} overlay={tooltip}>
        <span
          id={this.state.id}
          onClick={this.handleCopyToClipboard}
          onMouseLeave={this.handleMouseLeave}>
          {moment(date).fromNow()}{' '}
          {since && `(${moment(date).from(since, true)} later)`}
          <textarea
            ref={this.registerChild}
            style={{ width: 0, height: 0, opacity: 0 }}>
            {moment(date).toISOString()}
          </textarea>
        </span>
      </OverlayTrigger>
    );
  }
}

DateView.propTypes = {
  date: oneOfType([instanceOf(Date), string]).isRequired,
  since: oneOfType([instanceOf(Date), string]),
  placement: oneOf(['left', 'top', 'right', 'bottom']),
  format: string
};

DateView.defaultProps = {
  placement: 'top'
};
