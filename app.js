
require('dotenv').config(); // * Load environment variables from the .env file into process.env
const express = require('express'); // * Import the Express framework for building the server
const multer = require('multer'); // * Import Multer for handling file uploads (multipart/form-data)
const pdfkit = require('pdfkit'); // * Import PDFKit for generating PDF documents programmatically
const fs = require('fs'); // * Import Node.js File System (fs) module for working with files
const fsPromises = fs.promises; // * Use the Promise-based version of fs (fs.promises) for async/await operations

// * Import GoogleGenAI from the @google/genai package
//   - This is used to interact with Google's Generative AI models
import { GoogleGenAI } from "@google/genai";

const app = express(); // * Initialize an Express application
const PORT = process.env.PORT || 3000;


//! Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});