import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Alert } from 'react-bootstrap';
import styles from './styles.css';

class Notification extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      show: false
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.show && this.state.show) {
      setTimeout(() => {
        this.setState({ show: false });
      }, 2000);
    }
  }

  render() {
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
              {this.state.message}
            </Alert>
          )}
        </ReactCSSTransitionGroup>
      </div>
    );
  }

  show = message => this.setState({ message, show: true });
}

export default Notification;
