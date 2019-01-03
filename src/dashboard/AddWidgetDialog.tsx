import * as React from 'react';
import * as Modal from 'react-modal';

interface AddWidgetDialogProps {
  widgets: any;
  isModalOpen: boolean;
  onRequestClose: any;
  onWidgetSelect: any;
}

class AddWidgetDialog extends React.Component<AddWidgetDialogProps, {}> {
  constructor(props: AddWidgetDialogProps) {
    super(props);
  }
  render() {
    const widgetItems = Object.keys(this.props.widgets).map((widget, key) => {
      return (
        <div key={key} className="list-group">
          <a
            // href="#"
            // className="list-group-item"
            onClick={() => this.props.onWidgetSelect(widget)}>
            {this.props.widgets[widget].title}
          </a>
        </div>
      );
    });
    return (
      <div>
        <Modal
          className="Modal__Bootstrap modal-dialog"
          isOpen={this.props.isModalOpen}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add a widget</h5>
              <button
                type="button"
                className="close"
                onClick={this.props.onRequestClose}>
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="modal-body">
              <h6>Pick a widget to add</h6>
              {widgetItems}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-default"
                onClick={this.props.onRequestClose}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default AddWidgetDialog;
