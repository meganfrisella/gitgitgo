const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

function emptyStore() {
    const folderPath = path.join(process.cwd(), 'store');
    rimraf(folderPath, err => {
        if (err) {
            console.error('Error removing folder:', err);
            return;
        }
        // Recreate the empty folder
        fs.mkdir(folderPath, { recursive: true }, err => {
            if (err) {
                console.error('Error creating folder:', err);
                return;
            }
            console.log('Folder emptied and replaced:', folderPath);
        });
    });
}

emptyStore();