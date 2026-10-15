#!/usr/bin/env bash
echo "Building extensions.."

version="2.0.2"

echo "
Building H2L browser extenions

Creating Firefox extension zip file ...
"
cd extension-firefox
rm ../docs/dist/h2l-side-panel-firefox-$version.zip
zip -r ../docs/dist/h2l-side-panel-firefox-$version.zip . -x ".*" -x "__MACOSX"

echo "
Creating Edge extension zip file ...
"
cd ../extension-edge
rm ../docs/dist/h2l-side-panel-edge-$version.zip
zip -r ../docs/dist/h2l-side-panel-edge-$version.zip    . -x ".*" -x "__MACOSX"

echo "
Creating Chrome extension zip file ...
"
cd ../extension-chrome
rm ../docs/dist/h2l-side-panel-chrome-$version.zip
zip -r ../docs/dist/h2l-side-panel-chrome-$version.zip  . -x ".*" -x "__MACOSX"

echo "
Creating Opera extension crx file ...
"
cd ../extension-opera
crx3 . -p ../../pem/opera-h2l.pem -o ../docs/dist/h2l-side-panel-opera-$version.crx
