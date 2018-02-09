#!/bin/bash

cd `dirname $0`/..

pandoc -t html5 --section-divs -f markdown_github --template scripts/template.html README.ja.md > public/README.html

pandoc -t html5 --section-divs -f markdown_github --template scripts/template.html README.md > public/README.en.html
