import { PureComponent } from 'react';
import { Alert } from 'react-bootstrap';
import moment from 'moment';
import { horizontalRule, footer } from './styles.module.css';

const storageKey = 'hide-taskcluster-web-banner';

export default class TaskclusterWebBanner extends PureComponent {
  constructor(props) {
    super(props);

    const bannerMemory = localStorage.getItem(storageKey);

    this.state = {
      open: bannerMemory ? moment(bannerMemory).isBefore(new Date()) : true
    };
  }

  handleAlertClose = () => {
    this.setState({ open: false });

    localStorage.setItem(
      storageKey,
      moment()
        .add(2, 'week')
        .format()
    );
  };

  render() {
    const { open } = this.state;
    const { children } = this.props;

    return (
      open && (
        <Alert bsStyle="warning" onDismiss={this.handleAlertClose}>
          <h4>Try our new site and tell us what you think</h4>
          {children}
          <hr className={horizontalRule} />
          <div className={footer}>
            <small>
              Report bugs or missing features by{' '}
              <a href="https://github.com/taskcluster/taskcluster/issues/new">
                creating an issue
              </a>.
            </small>
          </div>
        </Alert>
      )
    );
  }
}
