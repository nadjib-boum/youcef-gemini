import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import fs from "fs";

dotenv.config();

const app = express();
const port = 3000;

const upload = multer({ dest: "uploads/" });

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY, // Set your key in env
});

// POST endpoint to upload a file
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // First Step: Upload the file to Google GenAI
    const uploadedFile = await ai.files.upload({
      file: filePath,
      config: { mimeType: req.file.mimetype },
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        `extract the date from this image in this format dd/mm/yyyy
I want raw date value without additions or changes`,
      ]),
    });

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      data: {
        text: response.text,
        uri: uploadedFile.uri,
      }
    });

  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ success: false, message: "Upload failed", error });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});



// import {
//   GoogleGenAI,
//   createUserContent,
//   createPartFromUri,
// } from "@google/genai";
// import dotenv from "dotenv";
// import express from "express";
// // import cors from "cors";

// dotenv.config();

// const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// async function main() {
//   const myfile = await ai.files.upload({
//     file: "path/to/sample.jpg",
//     config: { mimeType: "image/jpeg" },
//   });

//   const response = await ai.models.generateContent({
//     model: "gemini-2.0-flash",
//     contents: createUserContent([
//       createPartFromUri(myfile.uri, myfile.mimeType),
//       "Caption this image.",
//     ]),
//   });
//   console.log(response.text);
// }

// await main();