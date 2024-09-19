const express = require('express');
const multer = require('multer');
const cors = require('cors'); 
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); 
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware setup
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only .docx, .txt, and .pdf files
        if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/pdf'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only .docx, .txt, and .pdf files are allowed!'), false);
        }
    }
});

app.post('/upload', upload.single('cv'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Check the file type and process accordingly
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Process .docx file
        mammoth.extractRawText({ buffer: req.file.buffer })
            .then(result => {
                const cvText = result.value; // The plain text content of the .docx file
                const feedback = analyzeCV(cvText);
                res.json(feedback);
            })
            .catch(err => {
                res.status(500).send('Error processing .docx file: ' + err.message);
            });
    } else if (req.file.mimetype === 'application/pdf') {
        // Process PDF file
        pdf(req.file.buffer)
            .then(data => {
                const cvText = data.text; // The plain text content of the PDF file
                const feedback = analyzeCV(cvText);
                res.json(feedback);
            })
            .catch(err => {
                res.status(500).send('Error processing PDF file: ' + err.message);
            });
    } else {
        // Process plain text file
        const cvText = req.file.buffer.toString('utf-8');
        const feedback = analyzeCV(cvText);
        res.json(feedback);
    }
});

function analyzeCV(cvText) {
    // Define keywords to match
    const keywords = [
        'UX/UI designer', 'web development', 'Python', 'Node.js', 
        'React.js', 'Vue.js', 'Polymer', 'Lit Element', 
        'PostgreSQL', 'Docker', 'Agile development'
    ]; 

    let keywordCount = 0;

    // Check for each keyword in the CV text
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i'); // Word boundary to match whole words only
        if (regex.test(cvText)) {
            keywordCount++;
        }
    });

    const totalKeywords = keywords.length;
    const score = (keywordCount / totalKeywords) * 100; // Score as a percentage

    // Structure checks for ATS approval
    const structureChecks = {
        hasContactInfo: /(?:Contact|Email|Phone|Address)/i.test(cvText),
        hasSummary: /(?:Summary|Objective|Profile)/i.test(cvText),
        hasExperience: /(?:Work Experience|Experience|Employment|Professional Experience)/i.test(cvText),
        hasEducation: /(?:Education|Degrees|Certifications)/i.test(cvText),
        hasSkills: /(?:Skills|Technical Skills|Core Competencies)/i.test(cvText),
        hasProjects: /(?:Projects|Portfolio)/i.test(cvText)
    };

    // Calculate structure score based on presence of required sections
    const requiredSections = Object.values(structureChecks).filter(Boolean).length;
    const structureScore = (requiredSections / Object.keys(structureChecks).length) * 100;

    // Determine ATS approval status
    const isATSApproved = (score >= 70 && structureScore >= 70);

    return {
        message: 'CV analysis complete.',
        score: score.toFixed(2), // Return score as a string with two decimal places
        structureScore: structureScore.toFixed(2),
        results: {
            totalKeywords,
            matchedKeywords: keywordCount,
            structureChecks,
            overallScore: ((score + structureScore) / 2).toFixed(2), // Average of keyword and structure scores
            isATSApproved // Indicates whether the CV is ATS approved
        },
    };
}

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});