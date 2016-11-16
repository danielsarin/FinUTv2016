## Setup

1. Install Node.js v4 or higher
2. Install the SWORD Engine [http://www.crosswire.org/sword/index.jsp](http://www.crosswire.org/sword/index.jsp)
  - in OS X ex. run `brew update` and `brew install sword`
3. Install Microsoft Word

## Getting started

1. Convert the latest doc file to HTML
  - Open the doc file in Word and choose File -> Save as... -> File Format: Web Page (.htm)
  - Name the file `FinUTv2016.html` and place it in the root
2. Run `npm install`
3. Run `npm run build`
  - This will parse the HTML file to OSIS and create a SWORD module in dist

## Install on And Bible

1. Transfer the zip file in dist to your phone
2. Open And Bible and choose ... -> Administration -> Load Document From zip
and find the zip file n your phone
