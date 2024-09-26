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
router.post('/upload', upload.single('cv'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
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
        
        return res.status(200).json(feedback);
        
    } catch (err) {
        return res.status(500).json({ error: 'Error processing file: ' + err.message });
    }
});

// Define keywords and structure checks as constants
const keywords = [
    'Figma', 'Sketch', 'Adobe XD', 'Wireframing', 
    'Prototyping', 'User Research', 'Usability Testing', 
    'Responsive Design', 'HTML', 'CSS', 'JavaScript', 
    'Design Systems', 'Interaction Design', 'Typography','JavaScript', 'Node.js', 'React', 'MongoDB', 
  'CSS', 'HTML', 'Git', 'Agile', 'TypeScript', 
  'REST APIs', 'GraphQL', 'SQL', 'NoSQL', 'Docker', 'Kubernetes'
];

const structurePatterns = {
    hasContactInfo: /(?:Contact|Email|Phone|Address)/i,
    hasSummary: /(?:Summary|Objective|Profile)/i,
    experience: /(?:Work Experience|Experience|Employment|Professional Experience)/i,
    hasEducation: /(?:Education|Degrees|Certifications)/i,
    skills: /(?:Skills|Technical Skills|Core Competencies)/i,
    hasProjects: /(?:Projects|Portfolio)/i
};

async function analyzeCV(cvText, userId, filename) {
    let keywordCount = 0;
    
    // Highlight issues with keywords
    const missingKeywords = keywords.filter(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(cvText)) {
            keywordCount++;
            return false; // Found keyword, no issue
        }
        return true; 
    });

    const totalKeywords = keywords.length;
    const score = (keywordCount / totalKeywords) * 100; 

    const structureChecks = Object.fromEntries(
        Object.entries(structurePatterns).map(([key, regex]) => [key, regex.test(cvText)])
    );

    const missingSections = Object.keys(structureChecks).filter(key => !structureChecks[key]);

    const requiredSections = Object.values(structureChecks).filter(Boolean).length;
    const structureScore = (requiredSections / Object.keys(structureChecks).length) * 100;

    const isATSApproved = (score >= 70 && structureScore >= 70);

    const newCV = await CV.create({
        userId: userId, 
        filename: filename,
        content: cvText,
    });

    const failedChecks = missingKeywords.length > 0 || missingSections.length > 0;

    return {
        message: 'CV analysis complete.',
        score: score.toFixed(2), 
        structureScore: structureScore.toFixed(2),
        results: {
            totalKeywords,
            matchedKeywords: keywordCount,
            missingKeywords, 
            missingSections, 
            structureChecks,
            overallScore: ((score + structureScore) / 2).toFixed(2), 
            isATSApproved, 
            cvId: newCV.id,
            filename: newCV.filename,
        },
        issuesHighlighted: highlightIssues(cvText, missingKeywords, missingSections),
        atsStatus: isATSApproved ? "CV passed ATS check." : "CV failed ATS check.", // Clear ATS status
        failedChecks, 
        feedback: failedChecks 
            ? 'Your CV is missing important keywords or sections. Please review the highlighted areas and update accordingly.' 
            : 'Your CV looks great! It meets the ATS requirements.'
    };
}

function highlightIssues(cvText, missingKeywords, missingSections) {
    let highlightedText = cvText;

    missingKeywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi'); 
        highlightedText = highlightedText.replace(regex, '<span class="bg-yellow-200" style="color:red;">$1</span>');
    });

    missingSections.forEach(section => {
        highlightedText += `<br><strong  class="bg-yellow-200" style="color:red;">Missing section:</strong> ${section}`;
    });

    return highlightedText;
}

module.exports = router;