#!/bin/sh

BASEDIR=`dirname $0`

BASE_LOCALEDIR=../locale
TEMPLATE=en

LOCALES_DIR=$BASEDIR/locale
POFILES_DIR=$BASEDIR/pofile
XPIS_DIR=$BASEDIR/xpi

SUPPORTS=`cat $BASEDIR/SUPPORTS`

echo "process $TEMPLATE pofiles as template"
moz2po $BASE_LOCALEDIR/$TEMPLATE $POFILES_DIR/$TEMPLATE -P
rm $POFILES_DIR/$TEMPLATE/messages.properties.po
cp $BASE_LOCALEDIR/$TEMPLATE/messages.properties.po $POFILES_DIR/$TEMPLATE/messages.properties.pot
echo ""
echo ""

for LOCALE  in $SUPPORTS ; do
  echo "process $LOCALE with template ($TEMPLATE)"
  pot2po --nofuzzymatching $POFILES_DIR/$TEMPLATE -t $POFILES_DIR/$LOCALE $POFILES_DIR/${LOCALE}_tmp

  if [ ! -f $POFILES_DIR/$LOCALE/messages.properties.po ]; then
    cp $BASE_LOCALEDIR/$TEMPLATE/messages.properties.po $POFILES_DIR/$LOCALE/
  fi

  echo '#. extracted from ../locale/en/messages.properties' > $POFILES_DIR/${LOCALE}_tmp/messages.properties.po

  msgmerge -N -m --no-location $POFILES_DIR/$LOCALE/messages.properties.po $POFILES_DIR/$TEMPLATE/messages.properties.pot >> $POFILES_DIR/${LOCALE}_tmp/messages.properties.po
  rm -fr $POFILES_DIR/$LOCALE
  mv  $POFILES_DIR/${LOCALE}_tmp $POFILES_DIR/$LOCALE
  echo ""
done

