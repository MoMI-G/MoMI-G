#!/bin/bash

cd `dirname $0`/..

pandoc -t html5 --section-divs -f gfm --template scripts/template.html README.ja.md | sed -e "s/public\/images/images/g" > public/README.html

pandoc -t html5 --section-divs -f gfm --template scripts/template.html README.md | sed -e "s/public\/images/images/g" > public/README.en.html
