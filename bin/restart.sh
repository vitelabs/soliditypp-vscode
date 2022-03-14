#!/bin/bash
SCRIPT_DIR=$(cd $(dirname ${BASH_SOURCE[0]}); pwd)
cd $SCRIPT_DIR
if pgrep gvite >/dev/null;
then
    ./shutdown.sh
    ./startup.sh $1
else
    ./startup.sh $1
fi