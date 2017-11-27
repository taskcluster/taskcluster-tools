import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { arrayOf, shape, string, func, node } from 'prop-types';
import { Alert } from 'react-bootstrap';
import styles from './styles.css';

export default class SnackBar extends React.PureComponent {
  static propTypes = {
    toasts: arrayOf(
      shape({
        text: string.isRequired,
        icon: node
      })
    ),
    onDismiss: func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      toasts: [],
      show: false
    };
  }

  componentWillReceiveProps({ toasts }) {
    const length = toasts && toasts.length;

    if (length && length !== this.state.toasts.length) {
      this.setState({ toasts, show: true });

      setTimeout(() => {
        this.setState({ show: false });
        this.props.onDismiss();
      }, 2000);
    }
  }

  render() {
    const [toast] = this.state.toasts;

    return (
      <div className={styles.container}>
        <ReactCSSTransitionGroup
          transitionName={{
            enter: styles.enter,
            enterActive: styles.enterActive,
            leave: styles.leave,
            leaveActive: styles.leaveActive
          }}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>
          {this.state.show && (
            <Alert className={styles.alert} bsStyle="success">
              <div>
                {toast.icon && <span>{toast.icon}&nbsp;&nbsp;</span>}
                {toast.text}
              </div>
            </Alert>
          )}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}
