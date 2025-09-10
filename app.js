require('dotenv').config(); // * Load environment variables from the .env file into process.env
const express = require('express'); // * Import the Express framework for building the server
const multer = require('multer'); // * Import Multer for handling file uploads (multipart/form-data)
const pdfkit = require('pdfkit'); // * Import PDFKit for generating PDF documents programmatically
const fs = require('fs'); // * Import Node.js File System (fs) module for working with files
const fsPromises = fs.promises; // * Use the Promise-based version of fs (fs.promises) for async/await operations

// * Import GoogleGenAI from the @google/genai package
//   - This is used to interact with Google's Generative AI models
const { GoogleGenAI } = require("@google/genai");

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

// * Analyze Route
//   - Handles POST requests to '/analyze'
//   - For now, it simply responds with { success: true }
//   - Later, you can extend this to analyze uploaded data or text using genAI
app.post('/analyze', async (req, res) => {
    res.json({ success: true }); // * Send success response back to client
});


// * Download PDF Route
//   - Handles POST requests to '/download'
//   - Currently responds with { success: true }
//   - You can expand this to generate a PDF with pdfkit and send it to the client
app.post('/download', async (req, res) => {
    res.json({ success: true }); // * Send success response back to client
});


//! Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});