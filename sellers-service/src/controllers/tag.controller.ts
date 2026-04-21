import { Request, Response, NextFunction } from "express";
import { TagService } from "../services/tag.service";

const tagService = new TagService();

export class TagController {

    createTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const tag = await tagService.createTag(data);
            res.status(201).json(tag);
        } catch (error) {
            next(error);
        }
    }

    getTagById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const tag = await tagService.getTagById(id);
            res.status(200).json(tag);
        } catch (error) {
            next(error);
        }
    }

    updateTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            const data = req.body;
            const tag = await tagService.updateTag(id, data);
            res.status(200).json(tag);
        } catch (error) {
            next(error);
        }
    }

    softDeleteTag = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);
            await tagService.softDeleteTag(id);
            res.status(200).json({ message: "Tag eliminado exitosamente." });
        } catch (error) {
            next(error);
        }
    }

    getTagsByStoreId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const store_id = Number(req.params.store_id);
            const tags = await tagService.getTagsByStoreId(store_id);
            res.status(200).json(tags);
        } catch (error) {
            next(error);
        }
    }
}