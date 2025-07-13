const multer = require('multer');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8')
);


// const serviceAccount = require('../service-account.json');


if (!admin.apps.length) { // inits firebase if not already initialized
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "bed-circlelife-t02.firebasestorage.app"
  });
}
const bucket = admin.storage().bucket();

// Multer File Validation 
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

const handleUpload = (req, res) => {
  const folder = req.params.folder;

  const allowedFolders = [
  'profile_pictures',
  'communityEvents',     
  'medicationManager',
  'buddy-system',
  'transportNavigator',
  'exercise'
];
  if (!allowedFolders.includes(folder)) {
    return res.status(400).send('Error: Invalid upload destination.');
  }

  if (!req.file) {
    return res.status(400).send('Error: No file uploaded or file was rejected.');
  }

  const destination = `${folder}/${Date.now()}_${req.file.originalname}`;
  const blob = bucket.file(destination);

  const metadata = {
    metadata: {
      cacheControl: "public, max-age=172800"
    },
    resumable: false
  };

  const blobStream = blob.createWriteStream(metadata);

  blobStream.on('error', (err) => res.status(500).send({ message: err.message }));

  blobStream.on('finish', async () => {
    try {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(blob.name)}`;
      res.status(200).send({ url: publicUrl });
    } catch (err) {
      res.status(500).send({ message: "Uploaded but failed to make public", error: err.message });
    }
  });

  blobStream.end(req.file.buffer);
};

module.exports = {
  upload,
  handleUpload,
};