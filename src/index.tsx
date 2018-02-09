import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './App.css';

ReactDOM.hydrate(<App />, document.getElementById('root') as HTMLElement);
registerServiceWorker();
