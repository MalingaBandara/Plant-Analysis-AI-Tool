require('dotenv').config(); // * Load environment variables from the .env file into process.env
const express = require('express'); // * Import the Express framework for building the server
const multer = require('multer'); // * Import Multer for handling file uploads (multipart/form-data)
const pdfkit = require('pdfkit'); // * Import PDFKit for generating PDF documents programmatically
const fs = require('fs'); // * Import Node.js File System (fs) module for working with files
const fsPromises = fs.promises; // * Use the Promise-based version of fs (fs.promises) for async/await operations


// * Import GoogleGenAI from the @google/genai package
//   - This is used to interact with Google's Generative AI models
const { GoogleGenAI } = require("@google/genai");
const path = require('path');
const { rejects } = require('assert');

const app = express(); // * Initialize an Express application
const PORT = process.env.PORT || 3000;


// * Configure Multer middleware for handling file uploads
//   - Files will be temporarily stored in the 'uploads/' directory
const upload = multer({ dest: 'uploads/' }); 

// * Middleware to parse incoming JSON requests
//   - The limit option prevents payloads larger than 10MB
app.use(express.json({ limit: '10mb' }));

// * Initialize GoogleGenAI client with API key from environment variables
//   - Ensure GEMINI_API_KEY is defined in your .env file
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// * Serve static files from the 'public' directory
//   - Useful for serving HTML, CSS, JS, or image assets
app.use(express.static('public'));


//* Routes

//! Analyze Route
app.post('/analyze', upload.single('plant-img'), async (req, res) => {

  try {
    // * Step 1: Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file" });
    }

    // * Step 2: Read the uploaded file from disk and convert to base64
    const imagePath = req.file.path;
    const imageData = await fsPromises.readFile(imagePath, {
      encoding: "base64",
    });

    // * Step 3: Use GoogleGenAI SDK client to analyze the image
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash", // Specify the Gemini model to use
      contents: [
        // * Instruction text for the AI model
        `Analyze this plant image and provide detailed analysis of its species, 
        health, and care recommendations, its characteristics, care instructions, 
        and any interesting facts. Please provide the response in plain text without using any markdown formatting.`,
        {
          // * Inline data for the AI model (the uploaded image)
          inlineData: {
            mimeType: req.file.mimetype, // Tell the SDK the type of the uploaded file
            data: imageData, // Base64-encoded image content
          },
        },
      ],
    });

    // * Step 4: Extract the AI response text from the response object
    const plantInfo = response.candidates[0].content.parts[0].text;

    // * Step 5: Delete the uploaded file from the server to free up space1
    await fsPromises.unlink(imagePath);

    // * Step 6: Send JSON response back to client with plant info and base64 image
    res.json({
      result: plantInfo,
      image: `data:${req.file.mimetype};base64,${imageData}`,
    });
  } catch (error) {
    // * Error handling: log the error and send 500 response to client
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: "An error occurred while analyzing the image" });
  }

});



// ---------------- Download PDF Route ----------------
app.post('/download', express.json(), async (req, res) => {

  // Extract result text & image (base64) from request body
  const { result, image } = req.body;

  try {
    // ---------------- Setup PDF Output ----------------
    const reportsDir = path.join(__dirname, 'reports'); // Directory to save reports
    await fsPromises.mkdir(reportsDir, { recursive: true }); // Create directory if not exists

    const filename = `plant_analysis_report_${Date.now()}.pdf`; // Unique filename
    const filepath = path.join(reportsDir, filename); // Full file path

    // Create writable stream for PDF output
    const writeStream = fs.createWriteStream(filepath);

    // ---------------- Create PDF Document ----------------
    const pdfDoc = new pdfkit();
    pdfDoc.pipe(writeStream); // Pipe document content to file

    // Add title
    pdfDoc.fontSize(24).text('Plant Analysis Report', { underline: true, align: 'center' });
    pdfDoc.moveDown();

    // Add date
    pdfDoc.fontSize(24).text(`Date: ${new Date().toLocaleDateString()}`);
    pdfDoc.moveDown();

    // Add analysis result
    pdfDoc.fontSize(14).text(result, { align: 'left' });

    // ---------------- Add Image if Provided ----------------
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, ''); // Remove base64 header
      const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 → buffer

      pdfDoc.moveDown();
      pdfDoc.image(buffer, { fit: [500, 300], align: 'center', valign: 'center' }); // Add image
    }

    // Finalize PDF
    pdfDoc.end();

    // ---------------- Wait for PDF Creation ----------------
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // ---------------- Send File to Client ----------------
    res.download(filepath,  (err) => {
      if (err) {
        res.status(500).json({ error: 'Error downloading PDF Report' });
      }

       // Delete file after sending to client
      fsPromises.unlink(filepath);

    });

   

  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ error: "An error occurred while downloading the PDF" });
  }

});



//! Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});