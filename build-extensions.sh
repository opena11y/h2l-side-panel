#!/usr/bin/env bash
echo "Building extensions.."

version="2.0.0"

zip -r ./docs/dist/h2l-side-panel-firefox-$version.zip extension-firefox  -x ".*" -x "__MACOSX"
zip -r ./docs/dist/h2l-side-panel-chrome-$version.zip  extension-chrome   -x ".*" -x "__MACOSX"
zip -r ./docs/dist/h2l-side-panel-edge-$version.zip    extension-edge     -x ".*" -x "__MACOSX"
crx3 extension-opera -p ../pem/opera-h2l.pem -o ./docs/dist/h2l-side-panel-opera-$version.crx

