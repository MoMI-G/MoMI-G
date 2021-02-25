import * as React from 'react';
import DashBoard from './Dashboard';
import LazyLoad from 'react-lazy-load';
import ReactModal from 'react-modal';
import * as QueryString from 'query-string';

import 'bootstrap/dist/css/bootstrap.min.css';

class App extends React.Component<{}, { showModal: boolean }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      showModal: 'production' === process.env.NODE_ENV
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  render() {
    const parsedHash = QueryString.parse(window.parent.location.hash.slice(1));
    const postext = parsedHash.path
      ? parsedHash.path
      : process.env.DEFAULT_POS ? process.env.DEFAULT_POS : 'chr12:80,851,974-80,853,202';
    const uuid = parsedHash.uuid;
    const layout = parsedHash.layout ? Number(parsedHash.layout) : 0;
    const reference = parsedHash.ref ? parsedHash.ref : 'hg19';
    const subPath = parsedHash.annotations
      ? parsedHash.annotations === 'false' ? false : true
      : true;
    return (
      <div className="App" style={{ marginBottom: '130px' }}>
        <DashBoard
          posText={postext}
          uuid={uuid}
          keyId={layout}
          reference={reference}
          subPathAnnotation={subPath}
        />
        <div
          id="tooltip"
          style={{ display: 'flex', flexDirection: 'column' }}
        />
      </div>
    );
  }
}

export default App;
