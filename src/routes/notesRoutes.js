import { Router } from 'express';
import {
  createNote,
  deleteNote,
  getAllNotes,
  getNoteById,
  updateNote,
} from '../controllers/notesController.js';

const notesRoutes = Router();

notesRoutes.get('/', getAllNotes);
notesRoutes.get('/:noteId', getNoteById);
notesRoutes.post('/', createNote);
notesRoutes.delete('/:noteId', deleteNote);
notesRoutes.patch('/:noteId', updateNote);

export default notesRoutes;
