import { Router, Request, Response } from "express";
import { AuditLog } from "../model/AuditLog";

const router = Router();

// Récupérer tous les logs
router.get("/allaudit", async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1}); // récupère tout
    res.status(200).json(logs);
  } catch (err: any) {
    res.status(500).json({
      error: `Erreur lors de la récupération des logs: ${err.message}`,
    });
  }
});
// GET audits par afterId
router.get("/audit/:afterId", async (req, res) => {
  try {
    const { afterId } = req.params;
    
    const audits = await AuditLog.find({ "after.id": afterId }).sort({ createdAt: -1 });

    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'audit", error });
  }
});

// Récupérer les logs d'une collection précise
router.get("/audit/:collectionname", async (req: Request, res: Response) => {
  try {
    const { collectionName } = req.params;
    const logs = await AuditLog.find({ collectionName }); // filtre par collection
    res.status(200).json(logs);
  } catch (err: any) {
    res.status(500).json({
      error: `Erreur lors de la récupération des logs: ${err.message}`,
    });
  }
});

export default router;
