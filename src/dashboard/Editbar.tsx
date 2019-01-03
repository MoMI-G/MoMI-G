import * as React from 'react';

const EditBar = ({ onEdit }) => {
  return (
    <div className="row edit-bar">
      <div className="col-sm-12 text-right">
        <button
          type="button"
          className="btn btn-default btn-xs"
          title="Edit layouts"
          onClick={onEdit}
        >
          <span className="glyphicon glyphicon-pencil" aria-hidden="true" />
          Edit
        </button>
      </div>
    </div>
  );
};
export default EditBar;
