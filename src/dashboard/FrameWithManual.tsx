import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as FontAwesome from 'react-fontawesome';
import * as ReactTooltip from 'react-tooltip';
import { Helpable } from '../widgets/Utils';

export interface WrapperProps {
  children: any;
  onRemove: any;
  editable: boolean;
  title: string;
}

export interface WrapperState {
  link: string;
  help: React.ReactElement<null>;
}

class CustomFrame extends React.Component<WrapperProps, WrapperState> {
  private x: Helpable;
  constructor(props: WrapperProps) {
    super(props);
    this.state = { link: '', help: <div /> };
  }
  componentDidMount() {
    if (this.props.children.type.prototype.help !== undefined) {
      this.setState({
        link: this.props.children.type.prototype.link(),
        help: this.props.children.type.prototype.help()
      });
    }
  }
  render() {
    const newProps = { ref: ref => (this.x = ref) };
    /*const childrenWithProps = React.Children.map(this.props.children, child => {
      return React.cloneElement(child as React.ReactElement<any>, newProps);
    });*/
    return (
      <div className="x_panel fixed_height_200">
        <div
          className={`x_title ${this.props.title.split(' ')[0].toLowerCase()}`}>
          <div
            className="x_link"
            id={this.props.title.split(' ')[0].toLowerCase()}
          />
          <ul
            className="nav navbar-right panel_toolbox"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%'
            }}>
            <li>
              <span>
                <h6>
                  {this.props.title}
                  {'   '}
                </h6>
              </span>
            </li>
            <li>
              <span>
                <a
                  data-tip={this.props.title}
                  data-for={this.props.title}
                  target="_blank"
                  href={
                    this.state.link !== ''
                      ? './README.html#' + this.state.link
                      : '#'
                  }>
                  <FontAwesome name="question-circle" size="lg" />
                </a>
              </span>
            </li>
            {this.props.editable && (
              <li>
                <span>
                  <a
                    onClick={() => {
                      this.props.onRemove();
                    }}
                    className="close-link">
                    <i className="fa fa-close" />
                  </a>
                </span>
              </li>
            )}
          </ul>
          <ReactTooltip id={this.props.title}>{this.state.help}</ReactTooltip>
          <div className="clearfix" />
        </div>
        <div className="x_content">{this.props.children}</div>
      </div>
    );
  }
}

export default CustomFrame;
