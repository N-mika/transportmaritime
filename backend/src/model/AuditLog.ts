import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  collectionName: string;   // ex: "Boat"
  documentId: string;       // id du document modifié
  action: "create" | "update" | "delete";
  userId: string;          // qui a fait l’action
  before: any;             // ancienne valeur (pour update/delete)
  after: any;              // nouvelle valeur (pour create/update)
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    collectionName: { type: String, required: true },
    documentId: { type: String, required: true },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    userId: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
