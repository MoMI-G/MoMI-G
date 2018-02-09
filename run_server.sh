#!/bin/bash

webpack --watch &
webpack --config webpack.config.server.js --watch &

nodemon --watch build-ssr/client.js --watch build-ssr/server.js build-ssr/server.js
