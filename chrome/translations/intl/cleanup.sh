#!/bin/sh

BINDIR=`dirname $0`
find pofile -type f -exec $BINDIR/strip-comments.sh {} \;
