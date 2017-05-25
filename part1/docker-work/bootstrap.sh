#!/bin/bash

if [ "$JUST_RUN" = "N" ]; then
  echo switching node to version $NODE_VERSION
  n $NODE_VERSION --quiet
fi

echo node version: `node --version`

if [ "$JUST_RUN" = "N" ]; then
  git clone $GIT_URL app
fi

cd app

cd $APP_HOME
echo Application Home: $APP_HOME

if [ "$JUST_RUN" = "N" ]; then
  if [ "$YARN_INSTALL" = "1" ]; then
    yarn install --production --silent
  else
    npm install --production --silent
  fi
fi

if [ "$APP_STARTUP" = "" ]; then
  npm run $NPM_SCRIPT
else
  node $APP_STARTUP
fi
