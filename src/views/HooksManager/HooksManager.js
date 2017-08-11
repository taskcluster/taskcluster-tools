import React from 'react';
import { string } from 'prop-types';
import { Row, Col, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';
import equal from 'deep-equal';
import Error from '../../components/Error';
import Spinner from '../../components/Spinner';
import HelmetTitle from '../../components/HelmetTitle';
import HookBrowser from './HookBrowser';
import HookEditView from './HookEditView';
import './styles.css';

export default class HooksManager extends React.PureComponent {
  static propTypes = {
    hookGroupId: string,
    hookId: string
  };

  constructor(props) {
    super(props);

    this.state = {
      groups: null,
      error: null
    };
  }

  componentWillMount() {
    this.loadGroups();
  }

  componentWillReceiveProps(nextProps) {
    const needsUpdate = nextProps.currentHookGroupId !== this.props.currentHookGroupId ||
      nextProps.currentHookId !== this.props.currentHookId;

    if (needsUpdate) {
      this.loadGroups();
    } else if (this.state.error && !equal(nextProps.credentials, this.props.credentials)) {
      this.setState({ error: null });
    }
  }

  loadGroups = () => {
    this.setState({ groups: [] }, async () => {
      try {
        const { groups } = await this.props.hooks.listHookGroups();

        this.setState({
          groups,
          error: null
        });
      } catch (err) {
        this.setState({
          groups: null,
          error: err
        });
      }
    });
  };

  selectHook = (hookGroupId, hookId) => {
    if (hookId && hookId.includes('/')) {
      hookId = encodeURIComponent(hookId); // eslint-disable-line no-param-reassign
    }

    if (hookGroupId && hookId) {
      this.props.history.replace(`/hooks/${hookGroupId}/${hookId}`);
    } else if (hookGroupId) {
      this.props.history.replace(`/hooks/${hookGroupId}`);
    } else {
      this.props.history.replace('/hooks');
    }
  };

  renderGroups() {
    const { hooks, hookGroupId, hookId } = this.props;
    const { error, groups } = this.state;

    if (error) {
      return <Error error={error} />;
    }

    if (!groups) {
      return <Spinner />;
    }

    return (
      <div>
        {groups.map(group => (
          <HookBrowser
            key={group}
            hooks={hooks}
            group={group}
            selectHook={this.selectHook}
            hookGroupId={hookGroupId}
            hookId={hookId} />
        ))}
      </div>
    );
  }

  render() {
    const { hookGroupId, hookId, hooks } = this.props;
    const creating = !hookGroupId && !hookId;

    return (
      <Row>
        <HelmetTitle title="Hooks Manager" />
        <Col md={4}>
          <h4>Hooks Manager</h4>
          <hr />
          {this.renderGroups()}
          <hr />
          <ButtonToolbar>
            <Button
              bsStyle="primary"
              disabled={creating}
              onClick={() => this.selectHook(null, null)}>
              <Glyphicon glyph="plus" /> New Hook
            </Button>
            <Button bsStyle="success" onClick={this.loadGroups}>
              <Glyphicon glyph="refresh" /> Refresh
            </Button>
          </ButtonToolbar>
        </Col>
        <Col md={8}>
          <HookEditView
            hooks={hooks}
            hookGroupId={hookGroupId}
            hookId={hookId}
            refreshHookList={this.loadGroups}
            selectHook={this.selectHook} />
        </Col>
      </Row>
    );
  }
}
