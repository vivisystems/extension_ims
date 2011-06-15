#!/bin/sh

sed -e '/^#~/Q' < $1 > $1.tmp
mv $1.tmp $1
