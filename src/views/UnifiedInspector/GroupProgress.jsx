import { PureComponent } from 'react';
import { array } from 'prop-types';
import { ProgressBar, Label } from 'react-bootstrap';
import { titleCase } from 'change-case';
import equal from 'deep-equal';
import { labels } from '../../utils';

const groups = [
  'completed',
  'failed',
  'exception',
  'unscheduled',
  'running',
  'pending'
];

export default class GroupProgress extends PureComponent {
  static propTypes = {
    tasks: array
  };

  constructor(props) {
    super(props);
    this.state = {
      groupings: null,
      percents: null,
      weightedTotal: null
    };
  }

  componentWillMount() {
    if (!this.props.tasks) {
      return;
    }

    const groupings = this.groupTasksByStatus(this.props.tasks);
    const percents = this.getPercents(groupings, this.props.tasks);
    const weightedTotal = Object.values(percents).reduce(
      (total, current) => total + current,
      0
    );

    this.setState({
      groupings,
      percents,
      weightedTotal
    });
  }

  componentWillReceiveProps(nextProps) {
    if (equal(nextProps.tasks, this.props.tasks)) {
      return;
    }

    if (!nextProps.tasks) {
      return this.setState({
        groupings: null,
        percents: null,
        weightedTotal: null
      });
    }

    const groupings = this.groupTasksByStatus(nextProps.tasks);
    const percents = this.getPercents(groupings, nextProps.tasks);
    const weightedTotal = Object.values(percents).reduce(
      (total, current) => total + current,
      0
    );

    this.setState({
      groupings,
      percents,
      weightedTotal
    });
    this.handleGroupStateChange(percents);
  }

  groupTasksByStatus(tasks) {
    return tasks.reduce(
      (groupings, task) => ({
        ...groupings,
        [task.status.state]: [...(groupings[task.status.state] || []), task]
      }),
      {}
    );
  }

  getPercents(groupings, tasks) {
    const total = tasks.length;

    return Object.entries(groupings).reduce(
      (percents, [group, tasks]) => ({
        ...percents,
        [group]: Math.max(5, tasks.length / total * 100)
      }),
      {}
    );
  }

  handleGroupStateChange(percents) {
    if (percents.completed === 100) {
      this.props.onGroupStateChange('success');
    } else if (percents.failed) {
      this.props.onGroupStateChange('failed');
    } else {
      this.props.onGroupStateChange('pending');
    }
  }

  render() {
    const { tasks } = this.props;

    if (!tasks) {
      return null;
    }

    const { groupings, percents, weightedTotal } = this.state;

    return (
      <div>
        <ProgressBar style={{ borderRadius: 0, marginBottom: 5 }}>
          {Object.entries(groupings).map(([group, tasks]) => (
            <ProgressBar
              key={`group-progress-bar-${group}`}
              title={`${titleCase(group)} (${tasks.length})`}
              bsStyle={
                group === 'unscheduled' || group === 'running'
                  ? null
                  : labels[group]
              }
              style={group === 'unscheduled' ? { background: '#777' } : null}
              active={group === 'running'}
              now={percents[group] / weightedTotal * 100}
              label={
                tasks.length
                  ? `${group[0].toUpperCase()}(${tasks.length})`
                  : '...'
              }
            />
          ))}
        </ProgressBar>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            flexWrap: 'wrap'
          }}>
          {groups.map((group, index) => (
            <Label
              bsStyle={labels[group]}
              key={`legend-item-${index}`}
              style={{ borderRadius: 0, marginLeft: 10, marginBottom: 5 }}>
              {group}
            </Label>
          ))}
        </div>
      </div>
    );
  }
}
