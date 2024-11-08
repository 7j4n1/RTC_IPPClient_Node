// Contents of app.js
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { request } = require('http');

const app = express();
const port = 3080;

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Define the external server URL
const externalServerUrl = 'http://localhost:8013'; // Replace with actual server URL

// Routes
app.post('/get-printer-attributes', async (req, res) => {
    const { documentName, jobName } = req.body;

    var requestBody = {
        "IppMethod": 1,
        "RequestBody": {
            "document_name": documentName,
            "job_name": jobName
        }
    }

    try {
        var response = await axios.post(`${externalServerUrl}/getAttribute`, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                Cookie: req.headers.cookie // Forward cookies to external server
            }
        });
        res.send(response.data);
    } catch (error) {
        console.error("Error forwarding data to external server:", error.message);
        res.status(500).send("Failed to save job on external server.");
        
    }

    // Send data to external server
    console.log(req.headers.cookie);
});

app.post('/save-job', upload.single('file'), async (req, res) => {
  const { documentName, jobName } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send("File is required for saving the job.");
  }

  try {
    // Create FormData and append fields and file
    const formData = new FormData();
    formData.append('documentName', documentName);
    formData.append('jobName', jobName);
    formData.append('file', file.buffer, file.originalname);

    // Send data to external server
    const response = await axios.post(`${externalServerUrl}/saveJob`, formData, {
      headers: {
        ...formData.getHeaders(),
        Cookie: req.headers.cookie // Forward cookies to external server
      }
    });

    let responseData;
    // parse response.data if it is JSON
    try {
        responseData = JSON.parse(response.data);
    } catch (e) {
        responseData = response.data;
    }


    res.send(`External server response: ${response.data}`);
  } catch (error) {
    console.error("Error forwarding data to external server:", error.message);
    res.status(500).send("Failed to save job on external server.");
  }
});

app.post('/print-job', (req, res) => {

    const { documentName, jobName } = req.body;
    const response = axios.post(`${externalServerUrl}/printJob`, {
        documentName,
        jobName
    },
    {
        headers: {
            'Content-Type': 'application/json',
            Cookie: req.headers.cookie // Forward cookies to external server);
        }
    });
  res.send("Job printed successfully!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
