import React from 'react';
import { titleCase } from 'change-case';
import { Alert, Button, Collapse } from 'react-bootstrap';
import Markdown from '../Markdown';

export default class Error extends React.PureComponent {
  getTitle() {
    const { error } = this.props;

    if (error.code) {
      return `${titleCase(error.code.replace('Error', ''))} Error!`;
    }

    if (error.statusCode) {
      return `HTTP ${error.statusCode}`;
    }

    return 'Unknown Error';
  }

  render() {
    const { error } = this.props;

    if (error.statusCode === 403) {
      return (
        <Alert bsStyle="danger">
          <p>You are not authorized to perform the requested action. Please sign in and try again.</p>
        </Alert>
      );
    }

    return (
      <Alert bsStyle="danger">
        <strong>{this.getTitle()}&nbsp;</strong>
        <Markdown>
          {(() => {
            if (!error.message || process.env.NODE_ENV === 'development') {
              return `\`\`\`\n${error.stack}\n\`\`\``;
            }

            const index = error.message.indexOf('----');


            return index === -1 ? error.message : error.message.slice(0, index);
          })()}
        </Markdown>
        <Collapse title={<Button>Additional details...</Button>}>
          <pre>{JSON.stringify(error.body, null, 2)}</pre>
        </Collapse>
      </Alert>
    );
  }
}
