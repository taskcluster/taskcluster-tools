import { PureComponent } from 'react';
import DatePicker from 'react-datepicker';
import { oneOfType, object, string, func, bool } from 'prop-types';
import moment from 'moment';
import ModalItem from '../ModalItem';
import Markdown from '../Markdown';
import styles from './styles.module.css';

export default class QuarantineButton extends PureComponent {
  static propTypes = {
    className: string,
    disabled: bool,
    quarantineUntil: oneOfType([object, string]),
    onSubmit: func
  };

  static defaultProps = {
    className: null,
    disabled: false
  };

  constructor(props) {
    super(props);

    this.state = {
      quarantineUntil: props.quarantineUntil
        ? moment(new Date(props.quarantineUntil))
        : moment().add(1000, 'y')
    };
  }

  handleQuarantineChange = quarantineUntil => {
    this.setState({ quarantineUntil });
  };

  handleSubmit = () => this.props.onSubmit(this.state.quarantineUntil.format());

  render() {
    const isQuarantined = moment(new Date(this.props.quarantineUntil)).isAfter(
      moment()
    );

    return (
      <ModalItem
        button
        bsSize="sm"
        bsStyle={isQuarantined ? 'success' : 'warning'}
        disabled={this.props.disabled}
        className={this.props.className}
        onSubmit={this.handleSubmit}
        body={
          <div>
            <Markdown>
              Quarantining a worker allows the machine to remain alive but not
              accept jobs. Note that a quarantine can be lifted by setting
              `quarantineUntil` to the present time (or somewhere in the past).
            </Markdown>
            <br />
            <label>Quarantine Until</label>
            <DatePicker
              className={styles.datePicker}
              dateFormat="L"
              selected={this.state.quarantineUntil}
              onChange={this.handleQuarantineChange}
            />
          </div>
        }>
        {isQuarantined ? 'Update Quarantine' : 'Quarantine'}
      </ModalItem>
    );
  }
}
