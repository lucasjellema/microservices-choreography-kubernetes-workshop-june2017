#!/bin/bash

echo switching node to version $NODE_VERSION
n $NODE_VERSION --quiet

echo node version: `node --version`

git clone $GIT_URL app

cd app

if [ "$YARN_INSTALL" = "1" ]; then
  yarn install --production --silent
else
  npm install --production --silent
fi

cd $APP_HOME
echo Application Home: $APP_HOME

if [ "$APP_STARTUP" = "" ]; then
  npm run $NPM_SCRIPT
else
  node $APP_STARTUP
fi
