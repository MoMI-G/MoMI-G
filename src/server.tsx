import * as express from 'express';
import * as React from 'react';
import * as DOMServer from 'react-dom/server';
import App from './App';
import * as proxy from 'express-http-proxy';

// init express
const app = express();

// add static path
app.use(express.static('build'));
app.use(
  '/api/v0',
  proxy('localhost:8080/', {
    proxyReqPathResolver: function(req: any) {
      return '/api/v0' + require('url').parse(req.url).path;
    }
  })
);
app.use(
  '/api/v2',
  proxy('localhost:8081/', {
    proxyReqPathResolver: function(req: any) {
      return '/api/v2' + require('url').parse(req.url).path;
    }
  })
);

// add top page routing
app.get('/', (req: any, res: any) => {
  res.status(200).send(
    DOMServer.renderToString(
      <div>
        <div id="root" />
        <script src="./client.js" />
      </div>
    )
  );
});

// start listen
app.listen(3001, () => {
  console.log('Express server listening on port 3001!');
});
