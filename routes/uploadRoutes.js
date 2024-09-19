const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const CV = require('../models/CV'); 
const authMiddleware = require('../middlewares/authMiddleware'); 

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
       
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

// Upload route
router.post('/upload', authMiddleware, upload.single('cv'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    let cvText;

    try {
        if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            cvText = result.value;
        } else if (req.file.mimetype === 'application/pdf') {
            const data = await pdf(req.file.buffer);
            cvText = data.text; 
        } else {
            cvText = req.file.buffer.toString('utf-8');
        }

        const feedback = await analyzeCV(cvText, req.userId, req.file.originalname);
        
        res.json(feedback);
        
    } catch (err) {
        res.status(500).send('Error processing file: ' + err.message);
    }
});

async function analyzeCV(cvText, userId, filename) {
    const keywords = [
        'UX/UI designer', 'web development', 'Python', 'Node.js', 
        'React.js', 'Vue.js', 'Polymer', 'Lit Element', 
        'PostgreSQL', 'Docker', 'Agile development'
    ]; 

    let keywordCount = 0;

    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i'); 
        if (regex.test(cvText)) {
            keywordCount++;
        }
    });

    const totalKeywords = keywords.length;
    const score = (keywordCount / totalKeywords) * 100; 

    const structureChecks = {
        hasContactInfo: /(?:Contact|Email|Phone|Address)/i.test(cvText),
        hasSummary: /(?:Summary|Objective|Profile)/i.test(cvText),
        hasExperience: /(?:Work Experience|Experience|Employment|Professional Experience)/i.test(cvText),
        hasEducation: /(?:Education|Degrees|Certifications)/i.test(cvText),
        hasSkills: /(?:Skills|Technical Skills|Core Competencies)/i.test(cvText),
        hasProjects: /(?:Projects|Portfolio)/i.test(cvText)
    };

    const requiredSections = Object.values(structureChecks).filter(Boolean).length;
    const structureScore = (requiredSections / Object.keys(structureChecks).length) * 100;

    const isATSApproved = (score >= 70 && structureScore >= 70);

    const newCV = await CV.create({
        userId: userId, 
        filename: filename,
        content: cvText,
    });

    return {
        message: 'CV analysis complete.',
        score: score.toFixed(2), 
        structureScore: structureScore.toFixed(2),
        results: {
            totalKeywords,
            matchedKeywords: keywordCount,
            structureChecks,
            overallScore: ((score + structureScore) / 2).toFixed(2), 
            isATSApproved, 
            cvId: newCV.id,
            filename: newCV.filename,
        },
    };
}

module.exports = router;