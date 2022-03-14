#!/bin/bash
pgrep gvite | xargs kill -9
pgrep gvite | xargs wait
# keep the debug logs in ./ledger/devdata util the next start
SCRIPT_DIR=$(cd $(dirname ${BASH_SOURCE[0]}); pwd)
rm -rf $SCRIPT_DIR/ledger/devdata/ledger
rm -f $SCRIPT_DIR/gvite.log