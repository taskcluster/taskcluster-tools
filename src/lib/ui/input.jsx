import React, { PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';

class Input extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    hasFeedback: PropTypes.bool,
    help: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    id: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    type: PropTypes.string.isRequired,
  };

  getValue() {
    const inputNode = findDOMNode(this.refs.formControl);

    if (this.props.type === 'select' && inputNode.multiple) {
      return this.getMultipleSelectValues(inputNode);
    }

    return inputNode.value;
  }

  getMultipleSelectValues(selectNode) {
    const values = [];
    const options = selectNode.options;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];

      if (opt.selected) {
        values.push(opt.value || opt.text);
      }
    }

    return values;
  }

  render() {
    const { id, label, help, children, hasFeedback, labelClassName, wrapperClassName, ...props } = this.props;

    if (props.type === 'select' || props.type === 'textarea') {
      props.componentClass = props.type;
      delete props.type;
    }

    return (
      <FormGroup controlId={id} className={wrapperClassName}>
        {label && <ControlLabel className={labelClassName}>{label}</ControlLabel>}
        <FormControl ref="formControl" {...props}>{children}</FormControl>
        {hasFeedback && <FormControl.Feedback />}
        {help && <HelpBlock>{help}</HelpBlock>}
      </FormGroup>
    );
  }
}

export default Input;
