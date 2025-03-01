#!/usr/bin/env node

// to Install the package globally, 
// run the following command: sudo npm install -g .


// Import the version from package.json
const { version } = require('../package.json');

// Parse the command-line arguments
const args = process.argv.slice(2);

// Check for the `-v` or `--version` flag
if (args.includes('-v') || args.includes('--version')) {
    console.log(`server-mon version: ${version}`);
} else {
    console.log('Usage: server-mon -v');
}