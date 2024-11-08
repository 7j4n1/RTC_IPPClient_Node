// Contents of app.js
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3080;

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware
app.use(bodyParser.json());
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
            "job_name": jobName,
        }
    }

    try {
        var response = await axios.post(`${externalServerUrl}`, requestBody, {
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
    formData.append('file', file.buffer, file.originalname);

    // Send data to external server
    const response = await axios.post(`${externalServerUrl}/saveJob`, formData, {
      headers: {
        ...formData.getHeaders(),
        Cookie: req.headers.cookie // Forward cookies to external server
      }
    });

    let responseData;
    const contentType = response.headers['content-type'];
    // parse response.data if it is JSON
    if (contentType.includes('application/json')) {
        // Handle JSON response
        responseData = JSON.stringify(response.data);
      } else if (contentType.includes('text/plain')) {
        // Handle plain text response
        responseData = response.data;
      } else {
        // Handle other types of responses
        responseData = response.data;
      }


    res.send(responseData);

  } catch (error) {
    console.error("Error forwarding data to external server:", error.message);
    res.status(500).send("Failed to save job on external server.");
  }
});

app.post('/print-job', upload.none(), async (req, res) => {

    const { documentName, jobName, filePath } = req.body;


    var requestBody = {
        "IppMethod": 3,
        "RequestBody": {
            "documentName": documentName,
            "jobName": jobName,
            "filePath": filePath,
        }
    }
    console.log("Request body: ", JSON.stringify(requestBody));
    const response = await axios.post(`${externalServerUrl}`, requestBody,
    {
        headers: {
            'Content-Type': 'application/json',
            Cookie: req.headers.cookie // Forward cookies to external server);
        }
    });

    let responseData;
    try {
        responseData = JSON.parse(response.data);
    } catch (err) {
        responseData = response.data;
    }
  res.send(responseData);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
