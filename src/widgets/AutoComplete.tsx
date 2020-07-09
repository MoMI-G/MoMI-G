import * as Autosuggest from 'react-autosuggest';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Utils, PathRegion, Helpable } from './Utils';

// When suggestion is clicked, Autosuggest needs to populate the input
// based on the clicked suggestion. Teach Autosuggest how to calculate the
// input value for every given suggestion.
const getSuggestionValue = suggestion => suggestion;

// Use your imagination to render suggestions.
const renderSuggestion = suggestion => <div>{suggestion}</div>;

interface AutoCompleteProps {
  reference: string;
  value: string;
  onChange: any;
  placeholder: string;
  title?: string;
  width?: number;
}

interface AutoCompleteState {
  suggestions: string[];
}

class AutoComplete extends React.Component<
  AutoCompleteProps,
  AutoCompleteState
> {
  constructor(props: AutoCompleteProps) {
    super(props);
    // Autosuggest is a controlled component.
    // This means that you need to provide an input value
    // and an onChange handler that updates this value (see below).
    // Suggestions also need to be provided to the Autosuggest,
    // and they are initially empty because the Autosuggest is closed.
    this.state = {
      suggestions: []
    };
  }
  _getSuggestions(value: string) {
    const _this = this;
    if (value.length >= 2 && value.lastIndexOf('ch', 0) !== 0) {
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
  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = ({ value }) => {
    this._getSuggestions(value);
  };

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({ suggestions: [] });
  };

  render() {
    const value = this.props.value;
    const suggestions = this.state.suggestions;

    // Autosuggest will pass through all these props to the input.
    const inputProps = {
      placeholder: this.props.placeholder,
      value,
      onChange: this.props.onChange,
      style: { width: this.props.width }
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
      />
    );
  }
}

export default AutoComplete;
