import { PureComponent } from 'react';
import { string } from 'prop-types';
import SchemaViewer from 'react-schema-viewer';
import RefParser from 'json-schema-ref-parser/dist/ref-parser';

export default class SchemaTable extends PureComponent {
  static propTypes = {
    url: string.isRequired
  };

  state = {
    schema: null
  };

  async componentWillMount() {
    const schema = await (await fetch(this.props.url)).json();

    this.setState({ schema: await RefParser.dereference(schema) });
  }

  render() {
    const { schema } = this.state;

    if (!schema) {
      return null;
    }

    return <SchemaViewer schema={schema} />;
  }
}
