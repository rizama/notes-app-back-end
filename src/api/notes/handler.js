class NotesHandler {
    constructor(service, validator) {
        this._service = service;
        this._validator = validator;
    }

    async postNoteHandler(request, h) {
        this._validator.validateNotePayload(request.payload);
        const { title = 'untitled', body, tags } = request.payload;

        const noteId = await this._service.addNote({ title, body, tags });

        const response = h.response({
            status: 'success',
            message: 'Catatan berhasil ditambahkan',
            data: {
                noteId,
            },
        });
        response.code(201);
        return response;
    }

    async getNotesHandler(request, h) {
        const { name = '' } = request.query;

        this._validator.validateNoteQuery({ name });

        const notes = await this._service.getNotes();

        if (name !== '') {
            const dataNotes = notes.filter((note) => note.title === name);
            const response = h.response({
                status: 'success',
                data: {
                    notes: dataNotes,
                },
            });
            return response;
        }

        return {
            status: 'success',
            data: {
                notes,
            },
        };
    }
    async getNoteByIdHandler(request, h) {
        const { id } = request.params;
        const note = await this._service.getNoteById(id);
        return {
            status: 'success',
            data: {
                note,
            },
        };
    }

    async putNoteByIdHandler(request, h) {
        this._validator.validateNotePayload(request.payload);
        const { id } = request.params;

        await this._service.editNoteById(id, request.payload);

        return {
            status: 'success',
            message: 'Catatan berhasil diperbarui',
        };
    }

    async deleteNoteByIdHandler(request, h) {
        const { id } = request.params;
        await this._service.deleteNoteById(id);

        return {
            status: 'success',
            message: 'Catatan berhasil dihapus',
        };
    }
}

module.exports = NotesHandler;
