const fs = require('fs');
const fss = require('fs').promises;  // Use fs.promises for async file reading
const path = require('path');
//const xlsx = require('xlsx'); //for import user from excel

const multer = require('multer');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

exports.importFromExcel = catchAsync(async (req,Model, transformFn) => {
    console.log("hereexcel")
    console.log("request File",req.file)
  if (!req.file || !req.file.path) {
    return next(new AppError('File not uploaded or path is invalid.', 400));
  }

  if (!req.file.mimetype.includes('spreadsheetml') && !req.file.originalname.endsWith('.xlsx')) {
    return next(new AppError('Please upload a valid Excel file (.xlsx)', 400));
  }

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);
  console.log(jsonData)
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new AppError("Excel file is empty or data is not in the correct format.", 400);
  }

  const importedData = [];
  const errors = [];
  for (const [index, data] of jsonData.entries()) {
    try {
      const document = transformFn ? await transformFn(data) : new Model(data);
      console.log("Transformed Data:", document); // Log transformed user data
      const savedDocument = await document.save();
      importedData.push(savedDocument);
    } catch (error) {
      errors.push({ row: index + 1, error: error.message, data });
      continue; // Ensure processing continues for subsequent rows
    }
  }
  console.log("Returning from importFromExcel:", { importedData, errors });
return { importedData, errors };
});

// Utility function to export data to Excel
exports.exportToExcel = async (data, sheetName, fileName, res) => {
  try {
    // Convert data to plain JavaScript objects, ensuring subdocuments are included
    const dataObjects = data.map(item => item.toObject({ flattenMaps: true, minimize: false }));
    // minimize: false ensures empty objects or arrays are not removed.

    // Convert JSON data to worksheet
    const worksheet = xlsx.utils.json_to_sheet(dataObjects);
    const workbook = xlsx.utils.book_new(); // Create a new workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName); // Append worksheet to workbook
    const filePath = path.join(__dirname, '../uploads', fileName); // Define file path

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write workbook to file
    xlsx.writeFile(workbook, filePath);

    // Initiate download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Failed to download file:', err);
        res.status(500).send('Failed to download file');
      } else {
        // console.log('File downloaded successfully');
        fs.unlinkSync(filePath); // Optionally delete the file after download
      }
    });

  } catch (err) {
    console.error('Failed to export data to Excel file:', err);
    res.status(500).send('Failed to export data to Excel file');
  }
};

// exports.uploadFile = async (req, res) => {
//   try {
//     const { originalname, buffer } = req.file;

//     const file = new File({
//       fileName: req.file.filename,
//       originalName: originalname,
//       data: req.file.buffer, // Ensure this line is correct
//     });

//     await file.save();
//     res.send('File uploaded and saved to the database.');
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).send('Error uploading file.');
//   }
// };


// exports.uploadMultipleFiles = (req, res) => {
//   upload.array('files')(req, res, (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ error: 'Error uploading files' });
//     }

//     const files = req.files;
//     res
//       .status(200)
//       .json({ message: 'Files uploaded successfully', files: files });
//   });
// };


// Utility function to configure multer for file uploads

exports.createMulterMiddleware = (destinationFolder, filenamePrefix, fileTypes) => {
  console.log("Middleware initialization started");
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        cb(null, destinationFolder); // Ensure callback is invoked with the destination folder
      } catch (err) {
        console.error("Error in destination callback:", err.message);
        cb(err, null); // Pass error to callback
      }
    },
    filename: (req, file, cb) => {
      try {
        console.log("Processing file:", file);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const uniqueSuffix = `${year}-${month}-${date}-${now.getTime()}`;
        const { name } = path.parse(file.originalname);
        const fileExt = path.extname(file.originalname);
        const uniqueFilename = `${filenamePrefix}-${name}-${uniqueSuffix}${fileExt}`;
        cb(null, uniqueFilename); // Ensure callback is invoked with the unique filename
      } catch (err) {
        console.error("Error in filename callback:", err.message);
        cb(err, null); // Pass error to callback
      }
    },
  });

  console.log("Storage configured");

  // Configure file filter
  const fileFilter = (req, file, cb) => {
    console.log('File upload middleware hit');
    console.log('File type:', file.mimetype);
    try {
      if (fileTypes.includes(file.mimetype)) {
        console.log("requested fileType from Client", file.mimetype)
        console.log("Allowed FileTypes in the system", fileTypes)
        cb(null, true); // Accept the file
      } else {
        cb(new Error('File type not allowed'), false);
      }
    } catch (err) {
      console.error("Error in fileFilter:", err.message);
      cb(err, false); // Pass error to callback
    }
  };

  return multer({ storage, fileFilter });
};

//it is not working on saving on updating
exports.deleteFile = async (filePath) => {
  if (!filePath) {
    console.error('[deleteFile] ❌ No file path provided.');
    return;
  }

  try {
    // Optional: Normalize path for cross-platform consistency
    const normalizedPath = path.normalize(filePath);

    // Check if file exists first
    await fs.promises.access(normalizedPath, fs.constants.F_OK);

    // If exists, delete it
    await fs.promises.unlink(normalizedPath);
    console.log('[deleteFile] ✅ File deleted:', normalizedPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[deleteFile] ⚠️ File does not exist: ${filePath}`);
    } else {
      console.error(`[deleteFile] ❌ Error deleting file at ${filePath}:`, err);
    }
  }
};

// exports.processFileDataToSend = async (model,type={}) => {
//   const convertFileToBase64 = async (filePath) => {
//     try {
//       const buffer = await fss.readFile(filePath);
//       return buffer.toString('base64');
//     } catch (err) {
//       console.error(`Failed to read file at ${filePath}:`, err);
//       return null;
//     }
//   };

//   const processFiles = async (files = [], dir = '') =>
//     Promise.all(files.map(async (file) => {
//         const filePath = path.join(__dirname, '..', 'uploads', dir, file.fileName);
//         const fileData = await convertFileToBase64(filePath);
//         return {
//           fileName: file.fileName,
//           fileType: file.fileType || '',
//           description: file.description || '',
//           uploadDate: file.uploadDate || '',
//           id: file.id || '',
//           filePath,
//           fileData,
//         };
//       })
//     );

//   const profileData = model.profileImage
//     ? await convertFileToBase64(path.join(__dirname, '..', 'uploads', 'documents', model.profileImage))
//     : null;

//   const imagesData = await processFiles(model.images, 'documents');
//   const documentsData = await processFiles(model.documents, 'documents');

//   return { profileData, imagesData, documentsData };
// };
// ;

// exports.processFilesWithUrl = (req, files = [], folder = 'documents') => {
//   // console.log("processFilesWithUrl", files);
//   // console.log("protocol", req.protocol);
//   // console.log("host", req.get("host"));
  
//   return files.map(file => {
//     const url = `${req.protocol}://${req.get('host')}/uploads/${folder}/${file.fileName}`;
//     //const url = `${req.protocol}://${req.get('host')}/${path.posix.join(__dirname,"..",'uploads', folder, file.fileName)}`;
//     console.log("url", url);
//     return {
//       ...file,
//       url
//     };
//   });
// };

exports.processUploadFilesToSave = async (req, files = {}, body = {}, existingModel = null) => {
  files = files || {}; // ensures files is at least an empty object

  let profileImage = null;
  const basePath=`${req.protocol}://${req.get('host')}/uploads/`;
  console.log("basepPath",basePath)
  if (Array.isArray(files?.profileImage) && files.profileImage.length > 0) {
    profileImage = `${basePath}documents/${files.profileImage[0].filename}`;
  }

  if (existingModel && profileImage) {
  if (existingModel.profileImage && !existingModel.profileImage.includes('default.png')) {
    const oldImageFileName = path.basename(existingModel.profileImage); // avatar123.png
    const oldImagePath = path.join(__dirname, '..', 'uploads', 'documents', oldImageFileName);

    console.log('Trying to delete file:', oldImagePath);

    try {
      await exports.deleteFile(oldImagePath); // attempt delete
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }
}

  console.log("profileImages",profileImage)
  //console.log("files",files)

  // Handle multiple images (append to existing)
  const newImages = Array.isArray(files?.images)
    ? files.images.map(file => ({
        fileName: file.filename,
        fileType: file.mimetype,
        uploadDate: new Date(),
        filePath: `${basePath}documents/${file.filename}`,
      }))
    : [];

  console.log("newImages",newImages)
  console.log("existingModel",existingModel)
  if (newImages.length === 0 && existingModel) {
    newImages.push(...(existingModel.images || []));
  }

  const existingImages = existingModel?.images || [];
  // Append newImages to existingModel images (if any)
  const images = existingModel?.images
    ? [...newImages]
    : newImages;
  console.log("images",images)

  return { profileImage,images};
};

