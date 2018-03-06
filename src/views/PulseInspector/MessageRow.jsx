import { Component } from 'react';
import { bool, func, object } from 'prop-types';
import JsonInspector from '../../components/JsonInspector';

/**
 * Message row implemented to only re-render when strictly necessary
 *
 * Note, this relies on message._idForInspector to decide when to update.
 * In general there is no reason to reuse these instances.
 */
export default class MessageRow extends Component {
  static propTypes = {
    expanded: bool.isRequired,
    onClick: func.isRequired,
    message: object.isRequired
  };

  shouldComponentUpdate(nextProps) {
    // Just compare the _idForInspector
    if (
      // eslint-disable-next-line no-underscore-dangle
      this.props.message._idForInspector !== nextProps.message._idForInspector
    ) {
      return true;
    }

    return this.props.expanded !== nextProps.expanded;
  }

  // Do this indirectly so we don't have to render if the event handler changes
  handleClick = () => this.props.onClick();

  render() {
    const { message } = this.props;
    const hasCustomRoutes = !!(message.routes && message.routes.length);

    if (!this.props.expanded) {
      return (
        <tr
          onClick={this.handleClick}
          className="pulse-inspector-unexpanded-message">
          <td>
            <code>{message.exchange}</code>
          </td>
          <td>
            <code>{message.routingKey}</code>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td colSpan={2} className="pulse-inspector-expanded-message">
          <dl className="dl-horizontal">
            <dt>Exchange</dt>
            <dd>
              <code>{message.exchange}</code>
            </dd>
            <dt>Routing Key</dt>
            <dd>
              <code>{message.routingKey}</code>
            </dd>
            {hasCustomRoutes && <dt>Custom Routes</dt>}
            {hasCustomRoutes && (
              <dd>
                <ul>
                  {message.routes.map((route, index) => (
                    <li key={index}>
                      <code>route.{route}</code>
                    </li>
                  ))}
                </ul>
              </dd>
            )}
          </dl>
          <JsonInspector data={message.payload} />
          <br />
        </td>
      </tr>
    );
  }
}
