#!/bin/sh -x

BASEDIR=`dirname $0`

BASE_LOCALEDIR=../locale
TEMPLATE=en

LOCALES_DIR=$BASEDIR/locale
POFILES_DIR=$BASEDIR/pofile
XPIS_DIR=$BASEDIR/xpi

SUPPORTS=`cat $BASEDIR/SUPPORTS`

for LOCALE  in $SUPPORTS ; do
  echo "process $LOCALE with template ($TEMPLATE)"
  po2moz -t $BASE_LOCALEDIR/$TEMPLATE $POFILES_DIR/$LOCALE $LOCALES_DIR/$LOCALE
  msgcat $POFILES_DIR/$LOCALE/messages.properties.po -p | native2ascii -reverse | sed 's/^!\(.*\)=$/\1=\1/g' | sed 's/\\ / /g' | sed 's/\\!/!/g' | sed 's/\\:/:/g' | sed 's/\\#/#/g' > $LOCALES_DIR/$LOCALE/messages.properties
  rm -f $LOCALES_DIR/$LOCALE/*.po
  echo ""
done

