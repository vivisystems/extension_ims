#!/bin/sh -x

BASEDIR=`dirname $0`

BASE_LOCALEDIR=../locale
TEMPLATE=en

set -x

rel_date=`date +'%Y%m%d%H%M'`
version=`cat VERSION`
reg="s/<em:version>.*<\/em:version>/<em:version>${version}<\/em:version>/g"

LOCALES_DIR=$BASEDIR/locale
POFILES_DIR=$BASEDIR/pofile
XPIS_DIR=$BASEDIR/xpi

SUPPORTS=`cat $BASEDIR/SUPPORTS`

for LOCALE  in $SUPPORTS ; do
  echo "process $LOCALE XPI with template ($TEMPLATE)"

  if [ "$1" != "no" ]; then
    sed $reg $XPIS_DIR/$LOCALE/install.rdf > $XPIS_DIR/$LOCALE/install-new.rdf
    mv $XPIS_DIR/$LOCALE/install-new.rdf $XPIS_DIR/$LOCALE/install.rdf
  fi

  rm -rf $XPIS_DIR/$LOCALE/chrome/locale/$LOCALE
  mkdir -p $XPIS_DIR/$LOCALE/chrome/locale/$LOCALE
  cp -r $LOCALES_DIR/$LOCALE $XPIS_DIR/$LOCALE/chrome/locale/

  rm -f $XPIS_DIR/SimpleInventoryManagement-${LOCALE}_*.xpi
  rm -f $XPIS_DIR/SimpleInventoryManagement-${LOCALE}_*.sha1
  
  # pushd
  CUR_DIR=`pwd`
  cd $XPIS_DIR/$LOCALE

  # generate new SHA file
  sha1_filename=../SimpleInventoryManagement-${LOCALE}_${version}_${rel_date}.sha1
  sha1deep -r -l chrome.manifest chrome > ${sha1_filename}
  sha1sum=`sha1deep < ${sha1_filename}`
  regsum="s/<em:extensionHash>.*<\/em:extensionHash>/<em:extensionHash>sha1:${sha1sum}<\/em:extensionHash>/g"
  sed $regsum install.rdf > install-sum.rdf
  mv install-sum.rdf install.rdf

  zip -r ../SimpleInventoryManagement-${LOCALE}_${version}_${rel_date}.xpi *
  
  #popd
  cd $CUR_DIR

  echo ""
  echo ""
done

