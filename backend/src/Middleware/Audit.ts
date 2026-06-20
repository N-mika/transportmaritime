import { Schema } from "mongoose";
import { AuditLog } from "../model/AuditLog";

export const auditPlugin = (
  schema: Schema,
  options?: { collectionName?: string }
) => {
  const collectionName =
    options?.collectionName || schema.options.collection || "Unknown";

  // Create
  schema.post("save", async (doc) => {
    const userId = doc.userId || "system";
    await AuditLog.create({
      collectionName,
      documentId: doc._id,
      action: "create",
      userId,
      after: doc.toObject(),
    });
  });

  // Update (pre + post)
  schema.pre("findOneAndUpdate", async function () {
    (this as any)._oldDoc = await this.model.findOne(this.getQuery());
  });

  schema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
      const oldDoc = (this as any)._oldDoc;
      const userId = doc.userId || "system";
      await AuditLog.create({
        collectionName,
        documentId: doc._id,
        action: "update",
        userId,
        before: oldDoc?.toObject(),
        after: doc.toObject(),
      });
    }
  });

  // Delete
  schema.pre("findOneAndDelete", async function (next) {
    const docToDelete = await this.model.findOne(this.getQuery());
    if (docToDelete) {
      const userId = (this as any).options?.userId || "system";
      await AuditLog.create({
        collectionName,
        documentId: docToDelete._id,
        action: "delete",
        userId,
        before: docToDelete.toObject(),
      });
    }
    next();
  });
};
