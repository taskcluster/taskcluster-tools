import React from 'react';
import { array } from 'prop-types';
import { ProgressBar, Label } from 'react-bootstrap';
import { titleCase } from 'change-case';
import { labels } from '../../utils';

const groups = ['completed', 'failed', 'exception', 'unscheduled', 'running', 'pending'];

export default class GroupProgress extends React.PureComponent {
  static propTypes = {
    tasks: array
  };

  groupTasksByStatus() {
    return this.props.tasks.reduce((groupings, task) => ({
      ...groupings,
      [task.status.state]: [...(groupings[task.status.state] || []), task]
    }), {});
  }

  getPercents(groupings) {
    const total = this.props.tasks.length;

    return Object
      .entries(groupings)
      .reduce((percents, [group, tasks]) => ({
        ...percents,
        [group]: Math.max(5, (tasks.length / total) * 100)
      }), {});
  }

  render() {
    const { tasks } = this.props;

    if (!tasks) {
      return null;
    }

    const groupings = this.groupTasksByStatus();
    const percents = this.getPercents(groupings);
    const weightedTotal = Object
      .values(percents)
      .reduce((total, current) => total + current, 0);

    return (
      <div>
        <ProgressBar style={{ borderRadius: 0, marginBottom: 5 }}>
          {Object.entries(groupings).map(([group, tasks]) => (
            <ProgressBar
              key={`group-progress-bar-${group}`}
              title={`${titleCase(group)} (${tasks.length})`}
              bsStyle={group === 'unscheduled' || group === 'running' ? null : labels[group]}
              style={group === 'unscheduled' ? { background: '#777' } : null}
              active={group === 'running'}
              now={(percents[group] / weightedTotal) * 100}
              label={tasks.length ? `${group[0].toUpperCase()}(${tasks.length})` : '...'} />
          ))}
        </ProgressBar>

        <div>
          {groups.map((group, index) => (
            <Label bsStyle={labels[group]} key={`legend-item-${index}`} style={{ borderRadius: 0, marginLeft: 10 }}>
              {group}
            </Label>
          ))}
        </div>
      </div>
    );
  }
}
