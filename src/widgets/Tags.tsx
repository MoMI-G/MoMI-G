import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import { WithContext as ReactTags } from 'react-tag-input';
import * as TagsInput from 'react-tagsinput';
import AutosizeInput from 'react-input-autosize';

import 'react-tagsinput/react-tagsinput.css'; // If using WebPack and style-loader.

interface TagsProps {
  tags: string[];
  tagsUpdate: (tags: string[]) => void;
  suggestions: string[];
}

interface TagsState {
}

class Tags extends React.Component<TagsProps, {}> {
  constructor(props: TagsProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(tags) {
    this.props.tagsUpdate(tags);
  }

  render() {
    const autosizingRenderInput = ({ addTag, ...props }) => {
      let { onChange, value, ...other } = props;
      return (
        <AutosizeInput
          type="text"
          onChange={onChange}
          value={value}
          {...other}
        />
      );
    };
    return (
      <TagsInput
        value={this.props.tags}
        onChange={this.handleChange}
        renderInput={autosizingRenderInput}
      />
    );
  }
}

export default Tags;
