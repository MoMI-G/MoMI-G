import express from 'express'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import App from './App';

// init express
const app = express()

// add static path
app.use(express.static('build/dist'))

// add top page routing
app.get('/', (req, res) => {
  res.send(
    ReactDOMServer.renderToString(
      <div>
        <div id="root">
          <App />
        </div>
        <script src="client.js" />
      </div>
    )
  )
})

// start listen
app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
})
