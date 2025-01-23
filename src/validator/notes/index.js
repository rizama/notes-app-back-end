const InvariantError = require('../../exceptions/InvariantError');
const { NotePayloadSchema, NoteQuerySchema } = require('./schema');

const NotesValidator = {
    validateNotePayload: (payload) => {
        const validationResult = NotePayloadSchema.validate(payload);
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
    },
    validateNoteQuery: (payload) => {
        const validationResult = NoteQuerySchema.validate(payload);
        if (validationResult.error) {
            throw new InvariantError(validationResult.error.message);
        }
        return validationResult;
    },
};

module.exports = NotesValidator;
