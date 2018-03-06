import { PureComponent } from 'react';
import { array, func, string } from 'prop-types';
import {
  Col,
  Form,
  FormGroup,
  InputGroup,
  FormControl,
  ButtonGroup,
  DropdownButton,
  MenuItem
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Icon from 'react-fontawesome';
import { VALID_TASK } from '../../utils';

export default class SearchForm extends PureComponent {
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
    if (
      taskGroupId !== this.props.taskGroupId &&
      taskId !== this.props.taskId
    ) {
      this.setState({
        taskGroupIdInput: taskGroupId || '',
        taskIdInput: taskId || ''
      });
    } else if (taskGroupId !== this.props.taskGroupId) {
      this.setState({ taskGroupIdInput: taskGroupId || '' });
    } else if (taskId !== this.props.taskId) {
      this.setState({ taskIdInput: taskId || '' });
    }
  }

  handleTaskGroupIdInputChange = e => {
    this.setState({ taskGroupIdInput: e.target.value.trim() });
  };

  handleTaskIdInputChange = e => {
    this.setState({ taskIdInput: e.target.value.trim() });
  };

  handleSubmit = e => {
    e.preventDefault();

    const isValid = this.validate().form;

    if (!isValid) {
      return;
    }

    this.props.onSearch({
      taskGroupId: this.state.taskGroupIdInput || '',
      taskId: this.state.taskIdInput || ''
    });
  };

  validate() {
    const { taskGroupId, taskId } = this.props;
    const { taskGroupIdInput, taskIdInput } = this.state;
    const validTaskGroupId =
      VALID_TASK.test(taskGroupIdInput) || taskGroupIdInput === '';
    const validTaskId = VALID_TASK.test(taskIdInput) || taskIdInput === '';

    return {
      taskGroupId: validTaskGroupId,
      taskId: validTaskId,
      form:
        (taskGroupId !== taskGroupIdInput || taskId !== taskIdInput) &&
        validTaskGroupId &&
        validTaskId
    };
  }

  render() {
    const { taskGroupHistory, taskHistory } = this.props;
    const { taskGroupIdInput, taskIdInput } = this.state;
    const valid = this.validate();

    /* eslint-disable jsx-a11y/anchor-is-valid */
    return (
      <Form onSubmit={this.handleSubmit} horizontal>
        <Col lg={5} md={5} sm={4}>
          <FormGroup
            validationState={valid.taskGroupId ? null : 'error'}
            style={{ marginRight: 0 }}>
            <InputGroup>
              <InputGroup.Addon style={{ textAlign: 'left' }}>
                Task Group ID
              </InputGroup.Addon>
              <FormControl
                type="text"
                placeholder="Enter a task group ID"
                value={taskGroupIdInput}
                onChange={this.handleTaskGroupIdInputChange}
              />
            </InputGroup>
          </FormGroup>
        </Col>

        <Col lg={5} md={5} sm={4}>
          <FormGroup
            validationState={valid.taskId ? null : 'error'}
            style={{ marginRight: 0 }}>
            <InputGroup>
              <InputGroup.Addon style={{ textAlign: 'left' }}>
                Task ID
              </InputGroup.Addon>
              <FormControl
                type="text"
                placeholder="Enter a task ID or choose one from Tasks"
                value={taskIdInput}
                onChange={this.handleTaskIdInputChange}
              />
            </InputGroup>
          </FormGroup>
        </Col>

        <Col lg={2} md={2} sm={4} style={{ padding: 0 }}>
          <ButtonGroup justified style={{ marginBottom: 15 }}>
            <a
              onClick={valid.form ? this.handleSubmit : null}
              className={`btn btn-default${valid.form ? '' : ' btn-disabled'}`}>
              <Icon name="search" /> Inspect
            </a>
            <DropdownButton
              title="History"
              id="history-dropdown"
              disabled={!taskGroupHistory.length && !taskHistory.length}
              pullRight>
              <MenuItem header>Task Groups</MenuItem>
              {taskGroupHistory.length
                ? taskGroupHistory.map((taskGroupId, index) => (
                    <LinkContainer
                      to={`/groups/${taskGroupId}`}
                      key={`group-history-${index}`}>
                      <MenuItem>{taskGroupId}</MenuItem>
                    </LinkContainer>
                  ))
                : null}

              <MenuItem divider />
              <MenuItem header>Tasks</MenuItem>
              {taskHistory.length
                ? taskHistory.map((taskId, index) => (
                    <LinkContainer
                      to={`/tasks/${taskId}`}
                      key={`task-history-${index}`}>
                      <MenuItem>{taskId}</MenuItem>
                    </LinkContainer>
                  ))
                : null}
            </DropdownButton>
          </ButtonGroup>
        </Col>
      </Form>
    );
  }
}
