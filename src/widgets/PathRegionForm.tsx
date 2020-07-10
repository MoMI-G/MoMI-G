import * as Autosuggest from 'react-autosuggest';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Utils, PathRegion, Helpable, TagItem } from './Utils';
import AutoComplete from './AutoComplete';
import * as FontAwesome from 'react-fontawesome';
import Tags from './Tags';

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => <div>{suggestion}</div>;

interface PathRegionProps {
  pos: PathRegion;
  posUpdate: (reg: PathRegion) => void;
  posConcat: (reg: PathRegion[], featureId: number) => void;
  onItemSelect: () => void;
  onItemDelete: () => void;
  closeVisible: boolean;
  reference: string;
  color: string;
}

interface PathRegionState {
  pos: string;
  posInner: PathRegion;
  suggestions: string[];
}

class PathRegionForm extends React.Component<PathRegionProps, PathRegionState>
  implements Helpable {
  constructor(props: PathRegionProps) {
    super(props);
    this._posChange = this._posChange.bind(this);
    this._posUpdate = this._posUpdate.bind(this);
    this._scaleDown = this._scaleDown.bind(this);
    this._scaleUp = this._scaleUp.bind(this);
    this._scaleLeft = this._scaleLeft.bind(this);
    this._scaleRight = this._scaleRight.bind(this);
    this._chunkLeft = this._chunkLeft.bind(this);
    this._chunkRight = this._chunkRight.bind(this);
    this._tagsUpdate = this._tagsUpdate.bind(this);
    this._pinnedToggle = this._pinnedToggle.bind(this);
    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      pos: props.pos.toString(),
      posInner: props.pos,
      suggestions: []
    };
  }
  _posChange(event: any) {
    this.setState({ pos: event.target.value });
  }
  _tagsUpdate(newTags: TagItem[]) {
    let pos = this.props.pos;
    pos.name = newTags;
    this.props.posUpdate(pos);
  }
  _pinnedToggle() {
    let pos = this.props.pos;
    pos.isLocked = !pos.isLocked;
    this.props.posUpdate(pos);
  }
  _posUpdate(event: any) {
    event.preventDefault();
    const pos = Utils.strToRegion(this.state.pos);
    // console.log(pos, 'PathReg');
    const _this = this;
    if (pos[0] !== null) {
      // if it is the correct region.
      pos[0].name = this.state.posInner.name;
      this.props.posUpdate(pos[0]);
    } else {
      fetch(
        '/api/v2/feature?ref=' +
          this.props.reference +
          '&equals=' +
          this.state.pos.toUpperCase()
      )
        .then(function(response: Response) {
          return response.json();
        })
        .then(function(json2: any) {
          // FIXME() It discards the orient of gene.
          var pos2;
          if (Object.prototype.toString.call(json2) === '[object object]')
            json2[1] = json2; // For Compatible
          const pos = String(_this.state.pos);
          if (json2[1].start <= json2[1].stop) {
            pos2 = new PathRegion(
              json2[1].path,
              json2[1].start,
              json2[1].stop,
              true,
              [json2[0]]
            );
          } else {
            pos2 = new PathRegion(
              json2[1].path,
              json2[1].stop,
              json2[1].start,
              true,
              [json2[0]]
            );
          }
          _this.props.posUpdate(pos2);
          _this.setState({ pos: pos2.toString() });
        })
        .catch(function(err: any) {
          // handle error
          console.error(err);
        });
    }
  }
  _scaleDown(event: any) {
    this.props.posUpdate(this.state.posInner.scaleDown());
  }
  _scaleUp(event: any) {
    this.props.posUpdate(this.state.posInner.scaleUp());
  }
  _scaleLeft(event: any) {
    this.props.posUpdate(this.state.posInner.scaleLeft());
  }
  _scaleRight(event: any) {
    this.props.posUpdate(this.state.posInner.scaleRight());
  }
  _chunkLeft(event: any) {
    this.props.posUpdate(this.state.posInner.chunkLeft());
  }
  _chunkRight(event: any) {
    this.props.posUpdate(this.state.posInner.chunkRight());
  }
  _getSuggestions(value: string) {
    const _this = this;
    if (value.length >= 2) {
      fetch(
        '/api/v2/feature?ref=' +
          this.props.reference +
          '&startsWith=' +
          value.toUpperCase()
      )
        .then(function(response: Response) {
          return response.json();
        })
        .then(function(json: any) {
          _this.setState({ suggestions: json });
        })
        .catch(function(err: any) {
          // handle error
          console.error(err);
        });
    }
  }
  help() {
    return (
      <div>
        <h3>Path-Inputbox</h3>
        <p>
          Put the target coordinate such as (chr:start or chr:start-end) on the
          input box.
        </p>
      </div>
    );
  }
  link() {
    return 'path-regionform';
  }
  onChange = (event, { newValue }) => {
    this.setState({ pos: newValue });
  };

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = ({ value }) => {
    this._getSuggestions(value);
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({ suggestions: [] });
  };

  componentWillReceiveProps(props: PathRegionProps) {
    this.setState({
      posInner: props.pos,
      pos: props.pos.toString()
    });
  }

  render() {
    const value = this.state.pos;
    const suggestions = this.state.suggestions;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: 'Type a genomic region(path:start-stop) or gene name.',
      value,
      onChange: this.onChange,
      style: { width: 350 }
    };

    // Finally, render it!
    return (
      <div className="CurrentPosition" style={{ display: 'flux' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ marginRight: 'auto' }}>
            <Tags
              suggestions={this.state.suggestions}
              tags={this.props.pos.name}
              tagsUpdate={this._tagsUpdate}
            />
          </div>
          <button className="btn btn-primary" onClick={this.props.onItemSelect}>
            <FontAwesome name="bullseye" />
          </button>
          {(() => {
            if (this.props.closeVisible) {
              return (
                <button
                  className="btn btn-danger"
                  onClick={this.props.onItemDelete}>
                  <FontAwesome name="times-circle" />
                </button>
              );
            }
          })()}
        </div>
        <form className="commentForm" onSubmit={this._posUpdate}>
          <div
            style={{ display: 'flex', marginTop: '3px', marginBottom: '3px' }}>
            <span
              style={{
                color: this.props.color,
                transition: 'all .3s ease',
                marginLeft: '2px'
              }}>
              &#x25cf;
            </span>
            <AutoComplete
              value={this.state.pos}
              onChange={this.onChange}
              reference={this.props.reference}
              placeholder="Type a genomic region(path:start-stop) or gene name."
              width={310}
            />
            {'   '}
            <button
              className="btn btn-outline-primary"
              onClick={this._posUpdate}
              type="submit"
              title="Submit the region"
              disabled={this.state.posInner.isLocked}>
              <FontAwesome name="dot-circle-o" ariaLabel="OK" />
            </button>
          </div>
        </form>
        <button
          className="btn btn-outline-secondary"
          onClick={this._scaleUp}
          disabled={this.state.posInner.isLocked}
          title="Zoom up">
          +
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={this._scaleDown}
          disabled={this.state.posInner.isLocked}
          title="Zoom down">
          -
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={this._scaleLeft}
          disabled={this.state.posInner.isLocked}
          title="Move left">
          <FontAwesome name="arrow-left" />
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={this._scaleRight}
          disabled={this.state.posInner.isLocked}
          title="Move right">
          <FontAwesome name="arrow-right" />
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={this._chunkLeft}
          disabled={this.state.posInner.isLocked}
          title="Move left">
          <FontAwesome name="align-left" />
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={this._chunkRight}
          disabled={this.state.posInner.isLocked}
          title="Move right">
          <FontAwesome name="align-right" />
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => this.props.posConcat([this.state.posInner], null)}
          title="Clone region">
          <FontAwesome name="clone" />
        </button>
        <button
          className={`btn ${
            this.state.posInner.isLocked ? 'btn-danger' : 'btn-outline-danger'
          }`}
          onClick={this._pinnedToggle}>
          <FontAwesome name="thumb-tack" />
        </button>
      </div>
    );
  }
}

export default PathRegionForm;
