import React from 'react';
import { string, object, func } from 'prop-types';
import { Row, Col } from 'react-bootstrap';
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
      // TODO: disbale "Trigger Hook" button in the modal when not valid
      throw new Error('Trigger context is not valid YAML');
    } else {
      this.props.onTrigger(this.state.context);
    }
  };

  handleContextChange = value => {
    try {
      this.setState({
        context: safeLoad(value),
        contextValid: true
      });
    } catch (e) {
      this.setState({
        context: null,
        contextValid: false
      });
    }
  };

  render() {
    const triggerModal = (
      <div>
        Trigger Hook{' '}
        <tt>
          {this.props.hookGroupId}/{this.props.hookId}
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
          </Col>
          <Col lg={6} md={6} sm={12}>
            <h4>Trigger Schema</h4>
            <Code
              language="yaml"
              style={{ maxHeight: 250, overflow: 'scroll' }}>
              {safeDump(this.props.schema)}
            </Code>
          </Col>
        </Row>
      </div>
    );

    return (
      <ModalItem onSubmit={this.handleSubmit} button={true} body={triggerModal}>
        {this.props.children}
      </ModalItem>
    );
  }
}
