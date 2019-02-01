#!/bin/bash
tap test/unit/*.js

echo "cleaning up old dist"
rm -rf ./dist
echo "building tulip"
yarn dist
echo "tulip builds complete!"
