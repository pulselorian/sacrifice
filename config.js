const env = process.env;

const config = {
    listPerPage: env.LIST_PER_PAGE || 25,
}

module.exports = config;