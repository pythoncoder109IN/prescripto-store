import Tesseract from 'tesseract.js';
import { logger } from './logger.js';

export const processOCR = async (imageUrl) => {
  try {
    logger.info(`Starting OCR processing for image: ${imageUrl}`);
    
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    logger.info(`OCR completed with confidence: ${confidence}%`);
    
    return {
      text: text.trim(),
      confidence: Math.round(confidence)
    };
  } catch (error) {
    logger.error('OCR processing failed:', error);
    throw new Error('Failed to process prescription image');
  }
};

export const extractPrescriptionData = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const extractField = (keywords) => {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          return line.replace(/^[^:]*:?\s*/, '').trim();
        }
      }
    }
    return null;
  };

  const extractMedications = () => {
    const medications = [];
    const medicationKeywords = ['tablet', 'capsule', 'syrup', 'mg', 'ml', 'dose', 'tab', 'cap'];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (medicationKeywords.some(keyword => lowerLine.includes(keyword))) {
        // Try to extract medication details
        const parts = line.split(/\s+/);
        const medication = {
          name: parts[0] || '',
          dosage: extractDosage(line),
          frequency: extractFrequency(line),
          duration: extractDuration(line)
        };
        
        if (medication.name) {
          medications.push(medication);
        }
      }
    }
    
    return medications;
  };

  const extractDosage = (line) => {
    const dosageMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu)/i);
    return dosageMatch ? `${dosageMatch[1]}${dosageMatch[2].toLowerCase()}` : '';
  };

  const extractFrequency = (line) => {
    const frequencyPatterns = [
      /(\d+)\s*times?\s*(?:a\s*)?day/i,
      /(\d+)\s*times?\s*daily/i,
      /once\s*daily/i,
      /twice\s*daily/i,
      /thrice\s*daily/i,
      /bid/i,
      /tid/i,
      /qid/i
    ];

    for (const pattern of frequencyPatterns) {
      const match = line.match(pattern);
      if (match) {
        if (match[1]) return `${match[1]} times daily`;
        if (line.toLowerCase().includes('once')) return 'Once daily';
        if (line.toLowerCase().includes('twice')) return 'Twice daily';
        if (line.toLowerCase().includes('thrice')) return 'Three times daily';
        if (line.toLowerCase().includes('bid')) return 'Twice daily';
        if (line.toLowerCase().includes('tid')) return 'Three times daily';
        if (line.toLowerCase().includes('qid')) return 'Four times daily';
      }
    }
    return '';
  };

  const extractDuration = (line) => {
    const durationMatch = line.match(/(?:for\s*)?(\d+)\s*(days?|weeks?|months?)/i);
    return durationMatch ? `${durationMatch[1]} ${durationMatch[2].toLowerCase()}` : '';
  };

  return {
    doctorName: extractField(['dr', 'doctor', 'physician', 'md']),
    patientName: extractField(['patient', 'name', 'mr', 'mrs', 'ms']),
    date: extractField(['date', 'dated']),
    diagnosis: extractField(['diagnosis', 'condition', 'complaint']),
    medications: extractMedications(),
    instructions: extractField(['instructions', 'directions', 'advice', 'note'])
  };
};