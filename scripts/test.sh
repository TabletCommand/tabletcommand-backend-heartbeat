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

NODEv12="v12.18.2"

nvm install $NODEv12
nvm use $NODEv12
npm install
npm run lint 
npm run test
