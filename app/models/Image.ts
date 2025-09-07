import mongoose, { Schema, Document } from "mongoose";

export interface IImage extends Document {
  url: string;
  createdAt: Date;
  createdBy: string;
  date: string;
  time: string;
}

const ImageSchema: Schema = new Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
});

export default mongoose.models.Image || mongoose.model<IImage>("Image", ImageSchema);