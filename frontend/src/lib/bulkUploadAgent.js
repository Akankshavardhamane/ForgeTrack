import { genAI } from './gemini';

/**
 * AI Agent for reasoning about attendance data structure and gaps.
 */
export const bulkUploadAgent = {
  /**
   * Identifies student info columns and attendance date columns.
   * @param {Array} headers - Row containing headers
   * @param {Array} sampleRows - First few rows of data
   */
  async identifyColumns(headers, sampleRows) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are an AI agent specialized in parsing attendance spreadsheets.
        
        Headers found in sheet: ${JSON.stringify(headers)}
        Sample Data (first 5 rows): ${JSON.stringify(sampleRows)}
        
        Your task is to identify the mapping of these columns to our database fields.
        
        DATABASE FIELDS:
        1. Student USN (University Serial Number): Unique identifier like '4SF24CI005'.
        2. Student Name: Full name of the student.
        3. Attendance Dates: Columns where each column represents a specific class date.
        
        LOGIC FOR DATES:
        - If a header is a number like 46238, it is an Excel Serial Date. Convert it if possible, but keep the index.
        - If a header is missing or generic (e.g., "Column 5", "Field 2") but the data below contains attendance marks (P, A, Present, Absent, 1, 0, or checkmarks), mark it with "detectedDate": null and "status": "missing_header".
        - Only include columns that actually contain attendance data.
        
        Return ONLY a JSON object:
        {
          "usnColumnIndex": number,
          "nameColumnIndex": number,
          "dateColumns": [
            { 
              "index": number, 
              "header": "original_text", 
              "detectedDate": "YYYY-MM-DD or null",
              "status": "ok" | "missing_header" | "invalid_format"
            }
          ]
        }
      `;

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("AI Analysis timed out after 15s")), 15000)
      );

      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned invalid format: " + text);
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("AI Identify Columns Error:", error);
      throw error;
    }
  },

  /**
   * Suggests dates for columns with missing headers based on class schedule.
   * @param {Array} missingDateIndices - Indices of columns with missing headers
   * @param {string} usualDays - User input (e.g., "Monday, Wednesday")
   * @param {string} referenceDate - A known date in the sheet to use as context
   */
  async suggestMissingDates(missingDateIndices, usualDays, referenceDate) {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" }, { apiVersion: 'v1' });
    
    const prompt = `
      I have attendance columns with missing date headers. 
      The class usually happens on: ${usualDays}.
      A known reference date in the spreadsheet is: ${referenceDate}.
      There are ${missingDateIndices.length} columns with missing headers.
      
      Suggest the most likely dates for these columns in order. 
      Assume they follow the reference date or fill gaps between known dates.
      
      Return ONLY a JSON array of strings in YYYY-MM-DD format.
    `;

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Date Suggestion timed out after 15s")), 15000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI returned invalid format: " + text);
    return JSON.parse(jsonMatch[0]);
  },

  /**
   * Helper to convert Excel serial dates to ISO strings.
   */
  excelDateToJS(serial) {
    if (typeof serial !== 'number') return serial;
    // Excel base date is Dec 30, 1899
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
};
