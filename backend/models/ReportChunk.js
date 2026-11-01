import mongoose from "mongoose";

const reportChunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalRecord",
      required: true,
      index: true,
    },
    pageNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    sectionName: {
      type: String,
      default: "General",
      trim: true,
    },
    reportDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
      index: true,
    },
    reportTitle: {
      type: String,
      default: "Medical Report",
      trim: true,
    },
    category: {
      type: String,
      default: "Lab Reports",
    },
    extractedText: {
      type: String,
      required: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    extractionMethod: {
      type: String,
      enum: ["pdf_text", "ocr", "hybrid"],
      default: "pdf_text",
    },
    embedding: {
      type: [Number],
      default: [],
    },
    embeddingModel: {
      type: String,
      default: "gemini-embedding-001",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for security-scoped retrieval and date filtering
reportChunkSchema.index({ patient: 1, record: 1 });
reportChunkSchema.index({ patient: 1, reportDate: -1 });
reportChunkSchema.index({ record: 1, pageNumber: 1 });

// Full-text search index for exact keyword matching
reportChunkSchema.index(
  {
    extractedText: "text",
    sectionName: "text",
    reportTitle: "text",
  },
  {
    weights: {
      sectionName: 5,
      reportTitle: 3,
      extractedText: 1,
    },
    name: "ReportChunkTextIndex",
  }
);

export const ReportChunk = mongoose.model("ReportChunk", reportChunkSchema);
