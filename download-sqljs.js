// Script to download SQL.js WASM files
const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const publicDir = path.join(__dirname, 'public');
const sqlJsDir = path.join(publicDir, 'sql.js');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

if (!fs.existsSync(sqlJsDir)) {
  fs.mkdirSync(sqlJsDir);
}

// Files to download
const files = [
  'sql-wasm.js',
  'sql-wasm.wasm'
];

// Download each file
files.forEach(file => {
  const url = `https://sql.js.org/dist/${file}`;
  const filePath = path.join(sqlJsDir, file);
  
  console.log(`Downloading ${url} to ${filePath}...`);
  
  const fileStream = fs.createWriteStream(filePath);
  
  https.get(url, response => {
    response.pipe(fileStream);
    
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded ${file} successfully`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if there's an error
    console.error(`Error downloading ${file}: ${err.message}`);
  });
});