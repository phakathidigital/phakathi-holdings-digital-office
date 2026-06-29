import express from "express";

const router = express.Router();

router.post("/:functionName", (req, res) => {
  res.json({ success: true, functionName: req.params.functionName, placeholder: true });
});

export default router;
