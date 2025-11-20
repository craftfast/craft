export default {
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
            directUrl: process.env.DIRECT_DATABASE_URL,
        },
    },
};
