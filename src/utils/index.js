const mapDBToModel = ({
    id,
    title,
    body,
    tags,
    username,
    created_at: createdAt,
    updated_at: updatedAt,
}) => ({
    id,
    title,
    body,
    tags,
    username,
    createdAt,
    updatedAt,
});

module.exports = { mapDBToModel };
