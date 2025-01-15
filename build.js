const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// Copy all files except those we want to process
const filesToCopy = ['style.css', 'script.js'];
filesToCopy.forEach(file => {
    fs.copyFileSync(file, path.join('dist', file));
});

// Copy images folder if it exists
if (fs.existsSync('image')) {
    if (!fs.existsSync(path.join('dist', 'image'))) {
        fs.mkdirSync(path.join('dist', 'image'));
    }
    fs.readdirSync('image').forEach(file => {
        fs.copyFileSync(
            path.join('image', file),
            path.join('dist', 'image', file)
        );
    });
}

// Copy font folder if it exists
if (fs.existsSync('font')) {
    if (!fs.existsSync(path.join('dist', 'font'))) {
        fs.mkdirSync(path.join('dist', 'font'));
    }
    // Copy EN folder
    if (fs.existsSync(path.join('font', 'EN'))) {
        if (!fs.existsSync(path.join('dist', 'font', 'EN'))) {
            fs.mkdirSync(path.join('dist', 'font', 'EN'));
        }
        fs.readdirSync(path.join('font', 'EN')).forEach(file => {
            fs.copyFileSync(
                path.join('font', 'EN', file),
                path.join('dist', 'font', 'EN', file)
            );
        });
    }
    // Copy CH folder
    if (fs.existsSync(path.join('font', 'CH'))) {
        if (!fs.existsSync(path.join('dist', 'font', 'CH'))) {
            fs.mkdirSync(path.join('dist', 'font', 'CH'));
        }
        fs.readdirSync(path.join('font', 'CH')).forEach(file => {
            fs.copyFileSync(
                path.join('font', 'CH', file),
                path.join('dist', 'font', 'CH', file)
            );
        });
    }
}

// Read the template index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Add this before writing index.html:
const configContent = `
const config = {
    firebase: {
        apiKey: "${process.env.FIREBASE_API_KEY}",
        authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
        projectId: "${process.env.FIREBASE_PROJECT_ID}",
        storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
        messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
        appId: "${process.env.FIREBASE_APP_ID}",
        measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}"
    }
};
export default config;
`;

// Write the config file
fs.writeFileSync(path.join('dist', 'config.js'), configContent);

// Update the index.html content to use the config file
indexHtml = indexHtml.replace(
    /<!-- Initialize Firebase before your game script -->[\s\S]*?<!-- Load your game script/,
    `<!-- Initialize Firebase -->
    <script type="module">
        import config from './config.js';
        firebase.initializeApp(config.firebase);
        window.db = firebase.firestore();
        console.log('Firebase initialized successfully');
    </script>
    <!-- Load your game script`
);

// Write the processed index.html to dist
fs.writeFileSync(path.join('dist', 'index.html'), indexHtml);
