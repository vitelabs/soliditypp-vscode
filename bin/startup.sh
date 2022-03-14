#!/bin/bash
SCRIPT_DIR=$(cd $(dirname ${BASH_SOURCE[0]}); pwd)
rm -rf $SCRIPT_DIR/ledger
if [ $# == 1 ]; then
BIN_FILE=$1
else
BIN_FILE=gvite
fi
cd $SCRIPT_DIR
exec ./$BIN_FILE --pprof > ./gvite.log