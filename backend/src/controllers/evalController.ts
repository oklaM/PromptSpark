import { Request, Response } from 'express';
import { EvalLogModel, CreateEvalLogDTO } from '../models/EvalLog';

export class EvalController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateEvalLogDTO = req.body;
      const log = await EvalLogModel.create(data);
      res.status(201).json({
        success: true,
        data: log,
        message: 'Eval log created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create eval log'
      });
    }
  }

  static async getByPromptId(req: Request, res: Response): Promise<void> {
    try {
      const { promptId } = req.params;
      const logs = await EvalLogModel.getByPromptId(promptId);
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get eval logs'
      });
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { promptId } = req.params;
      const stats = await EvalLogModel.getStats(promptId);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get stats'
      });
    }
  }
}
