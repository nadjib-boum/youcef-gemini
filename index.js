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

  if (!req.file) {
    return res.status(400).json({ success: false, error:{ message: "No file uploaded" } });
  }

  const filePath = req.file.path;

  try {

    // First Step: Upload the file to Google GenAI
    const uploadedFile = await ai.files.upload({
      file: filePath,
      config: { mimeType: req.file.mimetype },
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: createUserContent([
        createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        `extract the date from this image in this format dd/mm/yyyy. I want raw date value without additions or changes`,
      ]),
    });

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

  } finally {

    await fs.unlink(filePath)

  }



});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});