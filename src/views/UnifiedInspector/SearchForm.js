import React from 'react';
import { array, func, string } from 'prop-types';
import { Col, Form, FormGroup, InputGroup, FormControl, Button, ButtonGroup, DropdownButton, MenuItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Icon from 'react-fontawesome';
import { VALID_TASK } from '../../utils';

export default class SearchForm extends React.PureComponent {
  static propTypes = {
    taskGroupId: string,
    taskId: string,
    onSearch: func.isRequired,
    taskGroupHistory: array,
    taskHistory: array
  };

  static defaultProps = {
    taskGroupHistory: [],
    taskHistory: []
  };

  constructor(props) {
    super(props);
    this.state = {
      taskGroupIdInput: props.taskGroupId || '',
      taskIdInput: props.taskId || ''
    };
  }

  componentWillReceiveProps({ taskGroupId, taskId }) {
    this.setState({
      taskGroupIdInput: taskGroupId || '',
      taskIdInput: taskId || ''
    });
  }

  handleTaskGroupIdInputChange = e => this.setState({ taskGroupIdInput: e.target.value.trim() });

  handleTaskIdInputChange = e => this.setState({ taskIdInput: e.target.value.trim() });

  handleSubmit = (e) => {
    e.preventDefault();

    const isValid = this.validate().form;

    if (!isValid) {
      return;
    }

    this.props.onSearch({
      taskGroupId: this.state.taskGroupIdInput || null,
      taskId: this.state.taskIdInput || null
    });
  };

  validate() {
    const { taskGroupId, taskId } = this.props;
    const { taskGroupIdInput, taskIdInput } = this.state;

    const validTaskGroupId = VALID_TASK.test(taskGroupIdInput) || taskGroupIdInput === '';
    const validTaskId = VALID_TASK.test(taskIdInput) || taskIdInput === '';

    return {
      taskGroupId: validTaskGroupId,
      taskId: validTaskId,
      form: (taskGroupId !== taskGroupIdInput || taskId !== taskIdInput) && validTaskGroupId && validTaskId
    };
  }

  render() {
    const { taskGroupHistory, taskHistory } = this.props;
    const { taskGroupIdInput, taskIdInput } = this.state;
    const valid = this.validate();

    return (
      <Form onSubmit={this.handleSubmit} horizontal>
        <Col lg={10} md={10} sm={9}>
          <FormGroup validationState={valid.taskGroupId ? null : 'error'}>
            <InputGroup>
              <InputGroup.Addon style={{ textAlign: 'left' }}>Task Group</InputGroup.Addon>
              <FormControl
                type="text"
                placeholder="Enter a task group ID, e.g. 8U3xVyssSBuinaXwRgJ_qQ"
                value={taskGroupIdInput}
                onChange={this.handleTaskGroupIdInputChange} />
            </InputGroup>
          </FormGroup>

          <FormGroup validationState={valid.taskId ? null : 'error'}>
            <InputGroup>
              <InputGroup.Addon style={{ textAlign: 'left' }}>Task</InputGroup.Addon>
              <FormControl
                type="text"
                placeholder="Enter a task ID or choose one from Tasks, e.g. 8U3xVyssSBuinaXwRgJ_qQ"
                value={taskIdInput}
                onChange={this.handleTaskIdInputChange} />
            </InputGroup>
          </FormGroup>
        </Col>

        <Col lg={2} md={2} sm={3}>
          <Col sm={12} style={{ marginBottom: 15, padding: 0 }}>
            <Button
              type="submit"
              disabled={!valid.form}
              block>
              <Icon name="search" /> Inspect
            </Button>
          </Col>
          <Col sm={12} style={{ marginBottom: 15, padding: 0 }}>
            <ButtonGroup justified>
              <DropdownButton
                title="History"
                id="history-dropdown"
                style={{ width: '100%' }}
                disabled={!taskGroupHistory.length && !taskHistory.length}
                pullRight>
                <MenuItem header>Task Groups</MenuItem>
                {taskGroupHistory.length ?
                  (
                    taskGroupHistory.map((taskGroupId, index) => (
                      <LinkContainer to={`/groups/${taskGroupId}`} key={`group-history-${index}`}>
                        <MenuItem>{taskGroupId}</MenuItem>
                      </LinkContainer>
                    ))
                  ) :
                  null
                }

                <MenuItem divider />
                <MenuItem header>Tasks</MenuItem>
                {taskHistory.length ?
                  (
                    taskHistory.map((taskId, index) => (
                      <LinkContainer to={`/tasks/${taskId}`} key={`task-history-${index}`}>
                        <MenuItem>{taskId}</MenuItem>
                      </LinkContainer>
                    ))
                  ) :
                  null
                }
              </DropdownButton>
            </ButtonGroup>
          </Col>
        </Col>
      </Form>
    );
  }
}
