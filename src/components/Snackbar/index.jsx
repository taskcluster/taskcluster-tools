import { PureComponent } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { arrayOf, shape, string, func, node } from 'prop-types';
import equal from 'deep-equal';
import { Alert } from 'react-bootstrap';
import styles from './styles.module.css';

export default class SnackBar extends PureComponent {
  static propTypes = {
    toasts: arrayOf(
      shape({
        text: string.isRequired,
        icon: node
      })
    ),
    onDismiss: func.isRequired
  };

  state = {
    toasts: [],
    show: false
  };

  componentWillReceiveProps({ toasts }) {
    if (!equal(toasts, this.state.toasts)) {
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
          {toast &&
            this.state.show && (
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
