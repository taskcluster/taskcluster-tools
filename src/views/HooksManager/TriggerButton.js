import React from 'react';
import { string, object, func } from 'prop-types';
import { Row, Col, Alert } from 'react-bootstrap';
import { safeLoad, safeDump } from 'js-yaml';
import Code from '../../components/Code';
import CodeEditor from '../../components/CodeEditor';
import ModalItem from '../../components/ModalItem';

export default class TriggerButton extends React.PureComponent {
  static propTypes = {
    hookId: string.isRequired,
    hookGroupId: string.isRequired,
    schema: object.isRequired,
    onTrigger: func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      context: {},
      contextValid: true
    };
  }

  handleSubmit = () => {
    if (!this.state.contextValid) {
      throw new Error('Trigger context is not valid');
    } else {
      this.props.onTrigger(this.state.context);
    }
  };

  handleContextChange = value => {
    let context;

    try {
      context = safeLoad(value);
    } catch (e) {
      return this.setState({
        context: null,
        contextValid: false,
        validityMessage: 'Trigger context is not valid YAML'
      });
    }

    this.setState({
      context,
      contextValid: true,
      validityMessage: undefined
    });
  };

  render() {
    const { hookGroupId, hookId, schema } = this.props;
    const { validityMessage } = this.state;
    const triggerModal = (
      <div>
        Trigger Hook{' '}
        <tt>
          {hookGroupId}/{hookId}
        </tt>
        with the following trigger context:
        <Row>
          <Col lg={6} md={6} sm={12}>
            <h4>Trigger Context</h4>
            <CodeEditor
              mode="yaml"
              lint={true}
              value={'{}'}
              onChange={this.handleContextChange}
            />
            {validityMessage && (
              <Alert bsStyle="warning">{validityMessage}</Alert>
            )}
          </Col>
          <Col lg={6} md={6} sm={12}>
            <h4>Trigger Schema</h4>
            <Code
              language="yaml"
              style={{ maxHeight: 250, overflow: 'scroll' }}>
              {safeDump(schema)}
            </Code>
          </Col>
          <pre>{JSON.stringify(this.state, null, 2)}</pre>
        </Row>
      </div>
    );

    return (
      <ModalItem
        submitDisabled={!this.state.contextValid}
        onSubmit={this.handleSubmit}
        button={true}
        body={triggerModal}>
        {this.props.children}
      </ModalItem>
    );
  }
}
