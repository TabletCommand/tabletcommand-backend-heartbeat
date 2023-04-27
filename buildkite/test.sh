#!/bin/bash

set -e

if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile
fi

if [ -f ~/.profile ]; then
    source ~/.profile
fi

# MacOS
if hash brew 2>/dev/null; then
    if [ -f  $(brew --prefix nvm)/nvm.sh ]; then
      source  $(brew --prefix nvm)/nvm.sh
    fi
fi

NODE_VERSION="v16.19.0"
NPM_VERSION="8.1.2"

nvm use $NODE_VERSION || nvm install $NODE_VERSION

EXISTING_NPM_VERSION=`npm --version`

if [ "$EXISTING_NPM_VERSION" != "$NPM_VERSION" ]; then
  echo "installing npm@$NPM_VERSION";
  npm i --global npm@$NPM_VERSION;
else
  echo "using npm@$NPM_VERSION";
fi

npm install
npm run lint 
npm run test
