import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as FontAwesome from 'react-fontawesome';
import * as ReactTooltip from 'react-tooltip';
import { Helpable } from './Utils';

export interface WrapperState {
  link: string;
  help: React.ReactElement<null>;
}

class Wrapper extends React.Component<{ id: string }, WrapperState> {
  private x: Helpable;
  constructor(props: { id: string }) {
    super(props);
    this.state = { link: '', help: <div /> };
  }
  componentDidMount() {
    this.setState({ link: this.x.link(), help: this.x.help() });
  }
  render() {
    const newProps = { ref: ref => (this.x = ref) };
    const childrenWithProps = React.Children.map(this.props.children, child => {
      return React.cloneElement(child as React.ReactElement<any>, newProps);
    });
    return (
      <div className="Component-container" style={{ display: 'flex' }}>
        {childrenWithProps}
        <a
          data-tip={this.props.id}
          data-for={this.props.id}
          target="_blank"
          href={
            this.state.link !== '' ? './README.html#' + this.state.link : '#'
          }
        >
          <FontAwesome name="question-circle" size="2x" />
        </a>
        <ReactTooltip id={this.props.id}>{this.state.help}</ReactTooltip>
      </div>
    );
  }
}

export default Wrapper;
